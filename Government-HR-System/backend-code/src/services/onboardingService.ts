import { pool } from '../db/pool';
import { EventEmitter } from 'events';

export const onboardingEvents = new EventEmitter();

export interface OnboardingChecklist {
  checklistId: string;
  employeeId: string;
  createdAt: string;
  items: OnboardingChecklistItem[];
}

export interface OnboardingChecklistItem {
  itemId: string;
  checklistId: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  category: 'IT' | 'HR' | 'Finance' | 'General';
}

export interface ITNotificationPayload {
  employeeId: string;
  checklistId: string;
  itemId: string;
  itemTitle: string;
  timestamp: string;
}

const DEFAULT_CHECKLIST_ITEMS: Array<{
  title: string;
  description: string;
  category: OnboardingChecklistItem['category'];
}> = [
  {
    title: 'Issue Employee ID Card',
    description: 'Create and issue official employee identification card',
    category: 'HR',
  },
  {
    title: 'Set Up Email Account',
    description: 'Create ministry email account and configure access',
    category: 'IT',
  },
  {
    title: 'Provision Laptop / Desktop',
    description: 'Assign and configure workstation for new employee',
    category: 'IT',
  },
  {
    title: 'Grant System Access',
    description: 'Set up access permissions for required systems',
    category: 'IT',
  },
  {
    title: 'Configure VPN Access',
    description: 'Set up VPN credentials and remote access',
    category: 'IT',
  },
  {
    title: 'Complete HR Paperwork',
    description: 'Collect and file all required HR documents',
    category: 'HR',
  },
  {
    title: 'Enroll in Payroll System',
    description: 'Add employee to payroll and configure salary details',
    category: 'Finance',
  },
  {
    title: 'Complete Orientation Training',
    description: 'Attend mandatory new employee orientation session',
    category: 'General',
  },
  {
    title: 'Health and Safety Briefing',
    description: 'Complete workplace health and safety training',
    category: 'General',
  },
  {
    title: 'Assign Desk / Office Space',
    description: 'Allocate physical workspace for the new employee',
    category: 'General',
  },
];

async function createChecklist(employeeId: string): Promise<OnboardingChecklist> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checklistResult = await client.query<{
      checklist_id: string;
      employee_id: string;
      created_at: string;
    }>(
      `INSERT INTO onboarding_checklists (employee_id, created_at)
       VALUES ($1, NOW())
       RETURNING checklist_id, employee_id, created_at`,
      [employeeId]
    );

    const checklist = checklistResult.rows[0];
    const checklistId = checklist.checklist_id;

    const itemInsertPromises = DEFAULT_CHECKLIST_ITEMS.map((item) =>
      client.query<{
        item_id: string;
        checklist_id: string;
        title: string;
        description: string;
        completed: boolean;
        completed_at: string | null;
        completed_by: string | null;
        category: OnboardingChecklistItem['category'];
      }>(
        `INSERT INTO onboarding_checklist_items
           (checklist_id, title, description, completed, completed_at, completed_by, category)
         VALUES ($1, $2, $3, false, NULL, NULL, $4)
         RETURNING item_id, checklist_id, title, description, completed, completed_at, completed_by, category`,
        [checklistId, item.title, item.description, item.category]
      )
    );

    const itemResults = await Promise.all(itemInsertPromises);

    await client.query('COMMIT');

    const items: OnboardingChecklistItem[] = itemResults.map((r) => {
      const row = r.rows[0];
      return {
        itemId: row.item_id,
        checklistId: row.checklist_id,
        title: row.title,
        description: row.description,
        completed: row.completed,
        completedAt: row.completed_at,
        completedBy: row.completed_by,
        category: row.category,
      };
    });

    const result: OnboardingChecklist = {
      checklistId,
      employeeId: checklist.employee_id,
      createdAt: checklist.created_at,
      items,
    };

    // Emit IT notification events for all IT-category items
    const itItems = items.filter((item) => item.category === 'IT');
    for (const itItem of itItems) {
      const payload: ITNotificationPayload = {
        employeeId,
        checklistId,
        itemId: itItem.itemId,
        itemTitle: itItem.title,
        timestamp: new Date().toISOString(),
      };
      onboardingEvents.emit('it:equipment:provision', payload);
    }

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getChecklist(checklistId: string): Promise<OnboardingChecklist | null> {
  const checklistResult = await pool.query<{
    checklist_id: string;
    employee_id: string;
    created_at: string;
  }>(
    `SELECT checklist_id, employee_id, created_at
     FROM onboarding_checklists
     WHERE checklist_id = $1`,
    [checklistId]
  );

  if (checklistResult.rows.length === 0) {
    return null;
  }

  const checklist = checklistResult.rows[0];

  const itemsResult = await pool.query<{
    item_id: string;
    checklist_id: string;
    title: string;
    description: string;
    completed: boolean;
    completed_at: string | null;
    completed_by: string | null;
    category: OnboardingChecklistItem['category'];
  }>(
    `SELECT item_id, checklist_id, title, description, completed, completed_at, completed_by, category
     FROM onboarding_checklist_items
     WHERE checklist_id = $1
     ORDER BY item_id`,
    [checklistId]
  );

  const items: OnboardingChecklistItem[] = itemsResult.rows.map((row) => ({
    itemId: row.item_id,
    checklistId: row.checklist_id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    category: row.category,
  }));

  return {
    checklistId: checklist.checklist_id,
    employeeId: checklist.employee_id,
    createdAt: checklist.created_at,
    items,
  };
}

async function getChecklistByEmployee(employeeId: string): Promise<OnboardingChecklist | null> {
  const checklistResult = await pool.query<{ checklist_id: string }>(
    `SELECT checklist_id FROM onboarding_checklists WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [employeeId]
  );

  if (checklistResult.rows.length === 0) {
    return null;
  }

  return getChecklist(checklistResult.rows[0].checklist_id);
}

async function completeItem(
  checklistId: string,
  itemId: string,
  completedBy: string
): Promise<OnboardingChecklistItem | null> {
  const result = await pool.query<{
    item_id: string;
    checklist_id: string;
    title: string;
    description: string;
    completed: boolean;
    completed_at: string | null;
    completed_by: string | null;
    category: OnboardingChecklistItem['category'];
  }>(
    `UPDATE onboarding_checklist_items
     SET completed = true, completed_at = NOW(), completed_by = $3
     WHERE checklist_id = $1 AND item_id = $2
     RETURNING item_id, checklist_id, title, description, completed, completed_at, completed_by, category`,
    [checklistId, itemId, completedBy]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const item: OnboardingChecklistItem = {
    itemId: row.item_id,
    checklistId: row.checklist_id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    category: row.category,
  };

  if (item.category === 'IT') {
    // Fetch employee ID for the notification
    const checklistResult = await pool.query<{ employee_id: string }>(
      `SELECT employee_id FROM onboarding_checklists WHERE checklist_id = $1`,
      [checklistId]
    );
    const employeeId =
      checklistResult.rows.length > 0 ? checklistResult.rows[0].employee_id : 'unknown';

    const payload: ITNotificationPayload = {
      employeeId,
      checklistId,
      itemId: item.itemId,
      itemTitle: item.title,
      timestamp: new Date().toISOString(),
    };
    onboardingEvents.emit('it:equipment:completed', payload);
  }

  return item;
}

async function getCompletionSummary(
  checklistId: string
): Promise<{ total: number; completed: number; percentage: number } | null> {
  const result = await pool.query<{ total: string; completed: string }>(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE completed = true) AS completed
     FROM onboarding_checklist_items
     WHERE checklist_id = $1`,
    [checklistId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const total = parseInt(result.rows[0].total, 10);
  const completed = parseInt(result.rows[0].completed, 10);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

export const onboardingService = {
  createChecklist,
  getChecklist,
  getChecklistByEmployee,
  completeItem,
  getCompletionSummary,
};
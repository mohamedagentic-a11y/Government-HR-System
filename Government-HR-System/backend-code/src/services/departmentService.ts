import { pool } from '../db/pool';

export interface DepartmentNode {
  DepartmentID: string;
  NameArabic: string;
  NameEnglish: string;
  ParentDepartmentID: string | null;
  ManagerID: string | null;
  children: DepartmentNode[];
}

export interface FlatDepartment {
  DepartmentID: string;
  NameArabic: string;
  NameEnglish: string;
  ParentDepartmentID: string | null;
  ManagerID: string | null;
}

function buildTree(
  departments: FlatDepartment[],
  parentId: string | null = null
): DepartmentNode[] {
  return departments
    .filter((d) => d.ParentDepartmentID === parentId)
    .map((d) => ({
      ...d,
      children: buildTree(departments, d.DepartmentID),
    }));
}

async function getOrgChartTree(): Promise<DepartmentNode[]> {
  const query = `
    WITH RECURSIVE dept_tree AS (
      SELECT
        "DepartmentID",
        "NameArabic",
        "NameEnglish",
        "ParentDepartmentID",
        "ManagerID"
      FROM "DEPARTMENT"
      WHERE "ParentDepartmentID" IS NULL

      UNION ALL

      SELECT
        d."DepartmentID",
        d."NameArabic",
        d."NameEnglish",
        d."ParentDepartmentID",
        d."ManagerID"
      FROM "DEPARTMENT" d
      INNER JOIN dept_tree dt ON d."ParentDepartmentID" = dt."DepartmentID"
    )
    SELECT * FROM dept_tree
    ORDER BY "ParentDepartmentID" NULLS FIRST, "NameArabic";
  `;

  const result = await pool.query<FlatDepartment>(query);
  const departments = result.rows;
  return buildTree(departments, null);
}

async function searchDepartmentsByName(
  searchTerm: string
): Promise<FlatDepartment[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  const query = `
    SELECT
      "DepartmentID",
      "NameArabic",
      "NameEnglish",
      "ParentDepartmentID",
      "ManagerID"
    FROM "DEPARTMENT"
    WHERE
      "NameArabic" ILIKE $1
      OR "NameEnglish" ILIKE $1
    ORDER BY "NameArabic";
  `;

  const pattern = `%${searchTerm.trim()}%`;
  const result = await pool.query<FlatDepartment>(query, [pattern]);
  return result.rows;
}

async function getDepartmentById(
  departmentId: string
): Promise<FlatDepartment | null> {
  const query = `
    SELECT
      "DepartmentID",
      "NameArabic",
      "NameEnglish",
      "ParentDepartmentID",
      "ManagerID"
    FROM "DEPARTMENT"
    WHERE "DepartmentID" = $1;
  `;

  const result = await pool.query<FlatDepartment>(query, [departmentId]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

async function getDepartmentSubtree(
  rootDepartmentId: string
): Promise<DepartmentNode[]> {
  const query = `
    WITH RECURSIVE dept_tree AS (
      SELECT
        "DepartmentID",
        "NameArabic",
        "NameEnglish",
        "ParentDepartmentID",
        "ManagerID"
      FROM "DEPARTMENT"
      WHERE "DepartmentID" = $1

      UNION ALL

      SELECT
        d."DepartmentID",
        d."NameArabic",
        d."NameEnglish",
        d."ParentDepartmentID",
        d."ManagerID"
      FROM "DEPARTMENT" d
      INNER JOIN dept_tree dt ON d."ParentDepartmentID" = dt."DepartmentID"
    )
    SELECT * FROM dept_tree
    ORDER BY "ParentDepartmentID" NULLS FIRST, "NameArabic";
  `;

  const result = await pool.query<FlatDepartment>(query, [rootDepartmentId]);
  const departments = result.rows;

  if (departments.length === 0) {
    return [];
  }

  const root = departments[0];
  return buildTree(departments, root.ParentDepartmentID);
}

async function getAllDepartmentsFlat(): Promise<FlatDepartment[]> {
  const query = `
    SELECT
      "DepartmentID",
      "NameArabic",
      "NameEnglish",
      "ParentDepartmentID",
      "ManagerID"
    FROM "DEPARTMENT"
    ORDER BY "NameArabic";
  `;

  const result = await pool.query<FlatDepartment>(query);
  return result.rows;
}

export const departmentService = {
  getOrgChartTree,
  searchDepartmentsByName,
  getDepartmentById,
  getDepartmentSubtree,
  getAllDepartmentsFlat,
};
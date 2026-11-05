import puppeteer from 'puppeteer';
import { pool } from '../db/pool';

interface PayrollRecord {
  EmployeeID: string;
  NameArabic: string;
  NationalID?: string;
  DepartmentName?: string;
  JobTitle?: string;
  BasicSalary: number;
  HousingAllowance?: number;
  TransportAllowance?: number;
  OtherAllowances?: number;
  Deductions?: number;
  NetSalary: number;
  PayPeriod: string;
  PayrollRunID?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function buildPayslipHTML(record: PayrollRecord): string {
  const basicSalary = record.BasicSalary || 0;
  const housingAllowance = record.HousingAllowance || 0;
  const transportAllowance = record.TransportAllowance || 0;
  const otherAllowances = record.OtherAllowances || 0;
  const deductions = record.Deductions || 0;
  const netSalary = record.NetSalary || 0;
  const totalAllowances = housingAllowance + transportAllowance + otherAllowances;
  const grossSalary = basicSalary + totalAllowances;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>قسيمة الراتب</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Noto Naskh Arabic', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      background-color: #ffffff;
      color: #1a1a2e;
      font-size: 14px;
      padding: 40px;
    }

    .payslip-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #1a3a5c;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .header {
      background: linear-gradient(135deg, #1a3a5c, #2e6da4);
      color: #ffffff;
      padding: 30px 40px;
      text-align: center;
    }

    .header .ministry-name {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: 1px;
    }

    .header .doc-title {
      font-size: 18px;
      font-weight: 600;
      color: #d4e8ff;
      margin-bottom: 4px;
    }

    .header .pay-period {
      font-size: 14px;
      color: #a8ccee;
    }

    .seal {
      display: inline-block;
      border: 2px solid #d4a017;
      border-radius: 50%;
      padding: 6px 14px;
      color: #d4a017;
      font-size: 12px;
      margin-top: 10px;
    }

    .section {
      padding: 20px 40px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1a3a5c;
      border-bottom: 2px solid #2e6da4;
      padding-bottom: 6px;
      margin-bottom: 14px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 30px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px dashed #e0e0e0;
    }

    .info-label {
      color: #555;
      font-size: 13px;
    }

    .info-value {
      font-weight: 600;
      color: #1a1a2e;
      font-size: 13px;
    }

    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .salary-table th {
      background-color: #2e6da4;
      color: #ffffff;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
    }

    .salary-table td {
      padding: 9px 16px;
      font-size: 13px;
      border-bottom: 1px solid #e8e8e8;
    }

    .salary-table tr:nth-child(even) td {
      background-color: #f5f9ff;
    }

    .salary-table tr:last-child td {
      border-bottom: none;
    }

    .amount {
      text-align: left;
      direction: ltr;
      font-weight: 600;
      color: #1a3a5c;
    }

    .deduction-amount {
      text-align: left;
      direction: ltr;
      font-weight: 600;
      color: #c0392b;
    }

    .total-row td {
      background-color: #eaf2fb !important;
      font-weight: 700;
      color: #1a3a5c;
      font-size: 14px;
    }

    .net-salary-section {
      background: linear-gradient(135deg, #1a3a5c, #2e6da4);
      color: #ffffff;
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .net-salary-label {
      font-size: 18px;
      font-weight: 700;
    }

    .net-salary-amount {
      font-size: 24px;
      font-weight: 700;
      direction: ltr;
      color: #d4e8ff;
    }

    .currency-label {
      font-size: 14px;
      color: #a8ccee;
      margin-right: 8px;
    }

    .footer {
      background-color: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      padding: 16px 40px;
      text-align: center;
      font-size: 11px;
      color: #888;
    }

    .divider {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 0;
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      color: rgba(46, 109, 164, 0.05);
      font-weight: 700;
      pointer-events: none;
      white-space: nowrap;
      z-index: -1;
    }
  </style>
</head>
<body>
  <div class="watermark">وثيقة رسمية</div>

  <div class="payslip-container">
    <!-- Header -->
    <div class="header">
      <div class="ministry-name">وزارة الحكومة - المملكة العربية السعودية</div>
      <div class="doc-title">قسيمة الراتب الشهري</div>
      <div class="pay-period">فترة الصرف: ${record.PayPeriod}</div>
      <div class="seal">وثيقة رسمية</div>
    </div>

    <!-- Employee Information -->
    <div class="section">
      <div class="section-title">بيانات الموظف</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">اسم الموظف</span>
          <span class="info-value">${record.NameArabic || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">رقم الموظف</span>
          <span class="info-value" style="direction:ltr;">${record.EmployeeID}</span>
        </div>
        <div class="info-item">
          <span class="info-label">القسم / الإدارة</span>
          <span class="info-value">${record.DepartmentName || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">المسمى الوظيفي</span>
          <span class="info-value">${record.JobTitle || '-'}</span>
        </div>
        ${record.NationalID ? `
        <div class="info-item">
          <span class="info-label">رقم الهوية الوطنية</span>
          <span class="info-value" style="direction:ltr;">${record.NationalID}</span>
        </div>` : ''}
      </div>
    </div>

    <hr class="divider" />

    <!-- Salary Breakdown -->
    <div class="section">
      <div class="section-title">تفاصيل الراتب</div>
      <table class="salary-table">
        <thead>
          <tr>
            <th>البيان</th>
            <th>المبلغ (ريال سعودي)</th>
          </tr>
        </thead>
        <tbody>
          <!-- Earnings -->
          <tr>
            <td><strong>المستحقات</strong></td>
            <td></td>
          </tr>
          <tr>
            <td>الراتب الأساسي</td>
            <td class="amount">${formatCurrency(basicSalary)}</td>
          </tr>
          ${housingAllowance > 0 ? `
          <tr>
            <td>بدل السكن</td>
            <td class="amount">${formatCurrency(housingAllowance)}</td>
          </tr>` : ''}
          ${transportAllowance > 0 ? `
          <tr>
            <td>بدل المواصلات</td>
            <td class="amount">${formatCurrency(transportAllowance)}</td>
          </tr>` : ''}
          ${otherAllowances > 0 ? `
          <tr>
            <td>بدلات أخرى</td>
            <td class="amount">${formatCurrency(otherAllowances)}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td>إجمالي المستحقات</td>
            <td class="amount">${formatCurrency(grossSalary)}</td>
          </tr>

          <!-- Deductions -->
          <tr>
            <td style="padding-top:16px;"><strong>الاستقطاعات</strong></td>
            <td></td>
          </tr>
          <tr>
            <td>إجمالي الاستقطاعات</td>
            <td class="deduction-amount">${formatCurrency(deductions)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Net Salary -->
    <div class="net-salary-section">
      <div class="net-salary-label">صافي الراتب المستحق</div>
      <div>
        <span class="currency-label">ريال سعودي</span>
        <span class="net-salary-amount">${formatCurrency(netSalary)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>هذه الوثيقة صادرة بصورة إلكترونية وهي معتمدة دون الحاجة إلى توقيع أو ختم.</p>
      <p>للاستفسار، يُرجى التواصل مع إدارة الموارد البشرية.</p>
      <p style="margin-top:4px;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
  </div>
</body>
</html>`;
}

async function generatePayslipBuffer(record: PayrollRecord): Promise<Buffer> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    const page = await browser.newPage();
    const html = buildPayslipHTML(record);

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function getPayrollRecord(
  employeeId: string,
  payPeriod: string
): Promise<PayrollRecord | null> {
  const result = await pool.query<PayrollRecord>(
    `SELECT
        pr."EmployeeID",
        e."NameArabic",
        e."NationalID",
        d."DepartmentName",
        e."JobTitle",
        pr."BasicSalary",
        pr."HousingAllowance",
        pr."TransportAllowance",
        pr."OtherAllowances",
        pr."Deductions",
        pr."NetSalary",
        pr."PayPeriod",
        pr."PayrollRunID"
      FROM payroll_records pr
      JOIN employees e ON e."EmployeeID" = pr."EmployeeID"
      LEFT JOIN departments d ON d."DepartmentID" = e."DepartmentID"
      WHERE pr."EmployeeID" = $1
        AND pr."PayPeriod" = $2
      ORDER BY pr."CreatedAt" DESC
      LIMIT 1`,
    [employeeId, payPeriod]
  );

  return result.rows[0] ?? null;
}

async function generatePayslipForEmployee(
  employeeId: string,
  payPeriod: string
): Promise<Buffer> {
  const record = await getPayrollRecord(employeeId, payPeriod);

  if (!record) {
    throw new Error(
      `No payroll record found for employee ${employeeId} and period ${payPeriod}`
    );
  }

  return generatePayslipBuffer(record);
}

async function generatePayslipFromRecord(record: PayrollRecord): Promise<Buffer> {
  return generatePayslipBuffer(record);
}

async function getLatestPayrollRecord(employeeId: string): Promise<PayrollRecord | null> {
  const result = await pool.query<PayrollRecord>(
    `SELECT
        pr."EmployeeID",
        e."NameArabic",
        e."NationalID",
        d."DepartmentName",
        e."JobTitle",
        pr."BasicSalary",
        pr."HousingAllowance",
        pr."TransportAllowance",
        pr."OtherAllowances",
        pr."Deductions",
        pr."NetSalary",
        pr."PayPeriod",
        pr."PayrollRunID"
      FROM payroll_records pr
      JOIN employees e ON e."EmployeeID" = pr."EmployeeID"
      LEFT JOIN departments d ON d."DepartmentID" = e."DepartmentID"
      WHERE pr."EmployeeID" = $1
      ORDER BY pr."CreatedAt" DESC
      LIMIT 1`,
    [employeeId]
  );

  return result.rows[0] ?? null;
}

async function generateLatestPayslip(employeeId: string): Promise<Buffer> {
  const record = await getLatestPayrollRecord(employeeId);

  if (!record) {
    throw new Error(`No payroll records found for employee ${employeeId}`);
  }

  return generatePayslipBuffer(record);
}

export const payslipService = {
  generatePayslipForEmployee,
  generatePayslipFromRecord,
  generateLatestPayslip,
  getPayrollRecord,
  getLatestPayrollRecord,
  buildPayslipHTML,
};
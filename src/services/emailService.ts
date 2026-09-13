import { Task, TaskPriority } from '@/types/task';
import { UserProfile } from '@/types/user';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Dispatches an email via the /api/send-email serverless / Vite dev proxy route
 */
export async function sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('Email dispatch failed:', data);
      return { success: false, error: data.error || 'Failed to send email' };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('Error invoking /api/send-email:', err);
    return { success: false, error: err.message || 'Network error while sending email' };
  }
}

/**
 * Format deadline date to readable string
 */
function formatDeadline(deadline: any): string {
  if (!deadline) return 'No deadline specified';
  try {
    const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(deadline);
  }
}

/**
 * Get priority badge styling for HTML emails
 */
function getPriorityStyles(priority: TaskPriority) {
  switch (priority) {
    case 'urgent':
      return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: '🔥 Urgent' };
    case 'high':
      return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74', label: '⚡ High' };
    case 'medium':
      return { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc', label: '📌 Medium' };
    case 'low':
    default:
      return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', label: '☕ Low' };
  }
}

const DEFAULT_APP_URL = 'https://task.unifiedcampusgrid.online';

/**
 * Base email layout wrapper with modern dark/light styling
 */
function wrapEmailTemplate(content: string, preheader: string = '', appUrl: string = DEFAULT_APP_URL): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroTask</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #09090b; color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .logo { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; }
    .logo span { color: #3b82f6; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 24px; }
    .btn:hover { background-color: #1d4ed8; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #71717a; }
  </style>
</head>
<body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px 12px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${appUrl}" style="font-size: 22px; font-weight: 800; color: #ffffff; text-decoration: none; letter-spacing: -0.5px;">
        Aero<span style="color: #3b82f6;">Task</span>
      </a>
    </div>
    
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
      ${content}
    </div>

    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #71717a;">
      <p style="margin: 4px 0;">This is an automated notification from <strong>AeroTask Workspace</strong>.</p>
      <p style="margin: 4px 0;">© ${new Date().getFullYear()} AeroTask. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends a rich notification email to assigned users when a task is created or updated
 */
export async function sendTaskAssignedEmail(options: {
  task: Partial<Task> & { id: string; title: string; description?: string; priority?: TaskPriority; deadline?: any; team?: string; checklist?: any[] };
  assignees: (UserProfile | { email: string; name?: string })[];
  assignerName?: string;
  appUrl?: string;
}): Promise<{ success: boolean; sentCount: number; errors?: string[] }> {
  const { task, assignees, assignerName = 'A teammate' } = options;
  const baseUrl = (options.appUrl && !options.appUrl.includes('localhost') ? options.appUrl : DEFAULT_APP_URL).replace(/\/+$/, '');

  const validEmails = assignees
    .map((u) => ({ email: u.email?.trim(), name: u.name || 'Team Member' }))
    .filter((u) => u.email && u.email.includes('@'));

  if (validEmails.length === 0) {
    return { success: false, sentCount: 0, errors: ['No valid recipient email addresses found'] };
  }

  const taskUrl = `${baseUrl}/user/tasks/${task.id}`;
  const priorityStyle = getPriorityStyles(task.priority || 'medium');
  const deadlineStr = formatDeadline(task.deadline);
  const checklistCount = task.checklist?.length || 0;

  let checklistHtml = '';
  if (checklistCount > 0) {
    checklistHtml = `
      <div style="margin-top: 16px; padding: 14px; background-color: #27272a; border-radius: 8px; border: 1px solid #3f3f46;">
        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">
          📋 Actionable To-Do & Checklist (${checklistCount} item${checklistCount > 1 ? 's' : ''})
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #e4e4e7;">
          ${task.checklist!.slice(0, 5).map((item) => `
            <li style="margin-bottom: 6px;">
              ${item.method ? `<span style="font-size: 10px; font-weight: bold; background-color: #3b82f6; color: #fff; padding: 1px 5px; border-radius: 3px; margin-right: 6px;">${item.method}</span>` : '<span style="color: #60a5fa; margin-right: 4px;">☑</span>'}
              <strong>${item.title || item.endpoint || 'Item'}</strong>
              ${item.endpoint && item.title && item.title !== item.endpoint ? `<span style="color: #a1a1aa; font-family: monospace; font-size: 11px; margin-left: 4px;">(${item.endpoint})</span>` : ''}
            </li>
          `).join('')}
          ${checklistCount > 5 ? `<li style="color: #a1a1aa; list-style-type: none; margin-top: 6px;">+ ${checklistCount - 5} more to-do items...</li>` : ''}
        </ul>
      </div>
    `;
  }

  const errors: string[] = [];
  let sentCount = 0;

  // Send to all assignees
  for (const recipient of validEmails) {
    const emailBody = `
      <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px;">
          🎯 New Task Assignment
        </span>
        <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 8px 0 0 0; line-height: 1.3;">
          ${task.title}
        </h1>
      </div>

      <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>${recipient.name}</strong>,<br>
        <strong>${assignerName}</strong> has assigned you a new task on AeroTask.
      </p>

      <!-- Task Details Box -->
      <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
          <span style="display: inline-block; background-color: ${priorityStyle.bg}; color: ${priorityStyle.text}; border: 1px solid ${priorityStyle.border}; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-right: 6px;">
            ${priorityStyle.label}
          </span>
          ${task.team ? `<span style="display: inline-block; background-color: #27272a; color: #a1a1aa; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; margin-right: 6px;">🏷️ ${task.team}</span>` : ''}
        </div>

        ${task.description ? `
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 12px 0;">
            ${task.description}
          </p>
        ` : ''}

        <div style="font-size: 13px; color: #e4e4e7; padding-top: 8px; border-top: 1px solid #1f1f23;">
          <div style="margin-bottom: 4px;">📅 <strong>Deadline:</strong> <span style="color: #f59e0b;">${deadlineStr}</span></div>
          <div>👤 <strong>Assigned By:</strong> ${assignerName}</div>
        </div>

        ${checklistHtml}
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="${taskUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
          View & Start Task →
        </a>
      </div>
    `;

    const html = wrapEmailTemplate(emailBody, `You have been assigned to "${task.title}" by ${assignerName}`);
    const res = await sendEmail({
      to: recipient.email,
      subject: `[AeroTask] New Task Assigned: ${task.title}`,
      html,
      text: `Hello ${recipient.name},\n\n${assignerName} has assigned you a new task: "${task.title}".\nDeadline: ${deadlineStr}\nPriority: ${task.priority || 'Medium'}\n\nView task: ${taskUrl}`,
    });

    if (res.success) {
      sentCount++;
    } else {
      errors.push(`Failed for ${recipient.email}: ${res.error}`);
    }
  }

  return {
    success: sentCount > 0,
    sentCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Sends a reminder email to assigned users
 */
export async function sendTaskReminderEmail(options: {
  task: Task;
  assignees: (UserProfile | { email: string; name?: string })[];
  senderName?: string;
  reminderNote?: string;
  appUrl?: string;
}): Promise<{ success: boolean; sentCount: number; errors?: string[] }> {
  const { task, assignees, senderName = 'Teammate', reminderNote } = options;
  const baseUrl = (options.appUrl && !options.appUrl.includes('localhost') ? options.appUrl : DEFAULT_APP_URL).replace(/\/+$/, '');

  const validEmails = assignees
    .map((u) => ({ email: u.email?.trim(), name: u.name || 'Team Member' }))
    .filter((u) => u.email && u.email.includes('@'));

  if (validEmails.length === 0) {
    return { success: false, sentCount: 0, errors: ['No valid recipient email addresses found'] };
  }

  const taskUrl = `${baseUrl}/user/tasks/${task.id}`;
  const priorityStyle = getPriorityStyles(task.priority || 'medium');
  const deadlineStr = formatDeadline(task.deadline);

  const errors: string[] = [];
  let sentCount = 0;

  for (const recipient of validEmails) {
    const emailBody = `
      <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="display: inline-block; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
          🔔 Task Reminder
        </span>
        <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 10px 0 0 0; line-height: 1.3;">
          ${task.title}
        </h1>
      </div>

      <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>${recipient.name}</strong>,<br>
        <strong>${senderName}</strong> is sending you a friendly reminder regarding your assigned task on AeroTask.
      </p>

      ${reminderNote ? `
        <div style="background-color: #27272a; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #93c5fd; text-transform: uppercase;">
            Note from ${senderName}:
          </p>
          <p style="margin: 0; font-size: 13px; color: #f4f4f5; font-style: italic;">
            "${reminderNote}"
          </p>
        </div>
      ` : ''}

      <!-- Task Details Box -->
      <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
          <span style="display: inline-block; background-color: ${priorityStyle.bg}; color: ${priorityStyle.text}; border: 1px solid ${priorityStyle.border}; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-right: 6px;">
            ${priorityStyle.label}
          </span>
          <span style="display: inline-block; background-color: #27272a; color: #e4e4e7; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px;">
            Status: ${task.status.toUpperCase().replace('_', ' ')}
          </span>
        </div>

        ${task.description ? `
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 12px 0;">
            ${task.description}
          </p>
        ` : ''}

        <div style="font-size: 13px; color: #e4e4e7; padding-top: 8px; border-top: 1px solid #1f1f23;">
          <div>📅 <strong>Deadline:</strong> <span style="color: #f59e0b; font-weight: 600;">${deadlineStr}</span></div>
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="${taskUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
          Open Task in AeroTask →
        </a>
      </div>
    `;

    const html = wrapEmailTemplate(emailBody, `Reminder: Action needed on "${task.title}"`);
    const res = await sendEmail({
      to: recipient.email,
      subject: `🔔 [Reminder] Action Needed: ${task.title}`,
      html,
      text: `Hello ${recipient.name},\n\n${senderName} has sent a reminder for task: "${task.title}".\n${reminderNote ? `Note: ${reminderNote}\n` : ''}Deadline: ${deadlineStr}\nStatus: ${task.status}\n\nOpen task: ${taskUrl}`,
    });

    if (res.success) {
      sentCount++;
    } else {
      errors.push(`Failed for ${recipient.email}: ${res.error}`);
    }
  }

  return {
    success: sentCount > 0,
    sentCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

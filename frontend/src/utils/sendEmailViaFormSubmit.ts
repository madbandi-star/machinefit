export type FormSubmitResult =
  | { success: true }
  | { success: false; needsActivation: boolean; message: string };

export async function sendEmailViaFormSubmit(options: {
  to: string;
  subject: string;
  message: string;
}): Promise<FormSubmitResult> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(options.to)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: options.subject,
        _template: 'table',
        _captcha: 'false',
        message: options.message,
        email: 'machinefit@noreply.local',
        name: 'MachineFit',
      }),
    });

    const data = (await res.json()) as { success?: string | boolean; message?: string };
    const ok = data.success === 'true' || data.success === true;

    if (ok) {
      return { success: true };
    }

    const message = data.message ?? 'FormSubmit failed';
    const needsActivation = /activation|activate/i.test(message);
    return { success: false, needsActivation, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FormSubmit failed';
    return { success: false, needsActivation: false, message };
  }
}

export function htmlReportToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

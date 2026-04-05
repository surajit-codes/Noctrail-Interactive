import { Resend } from 'resend';
import { BriefingData } from './briefingTypes';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBriefingEmail(to: string, briefing: BriefingData, name?: string) {
  try {
    const today = new Date(briefing.date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const { data, error } = await resend.emails.send({
      from: 'BriefAI <onboarding@resend.dev>', // Use verified domain in prod
      to: [to],
      subject: `🌅 Your CEO Morning Briefing - ${today}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a2e; background-color: #f8fafc; border-radius: 12px;">
          <h1 style="color: #8b5cf6; margin-bottom: 8px;">BriefAI</h1>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">Executive Daily Update for ${today}</p>
          
          ${name ? `<p>Hello <strong>${name}</strong>,</p>` : '<p>Hello,</p>'}
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 24px;">
            <h2 style="font-size: 18px; margin-top: 0;">Executive Summary</h2>
            <p style="line-height: 1.6;">${briefing.executive_summary}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Market Pulse</h3>
            <p><strong>NIFTY Trend:</strong> ${briefing.market_pulse.nifty_trend}</p>
            <p><strong>Sentiment:</strong> ${(briefing.market_pulse.sentiment_score * 100).toFixed(0)}% (${briefing.market_pulse.decision})</p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Top Opportunities</h3>
            <ul style="padding-left: 20px;">
              ${briefing.business_opportunities.map(opp => `
                <li style="margin-bottom: 12px;">
                  <strong>${opp.title}</strong> (${opp.urgency})<br/>
                  <span style="font-size: 13px; color: #4b5563;">${opp.description}</span><br/>
                  <span style="font-size: 13px; color: #8b5cf6;">Next Action: ${opp.action}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 40px;">
            © 2026 BriefAI. Delivering Alpha to your inbox.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: String(err) };
  }
}

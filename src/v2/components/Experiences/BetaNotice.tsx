// ============================================================================
// BetaNotice — a quiet line on an experience's overview that the tool is in
// beta and that feedback is welcome. It looks like the "How does this model
// work?" link and, when it can, opens the Feedback page from the nav.
// ============================================================================

import { MessageSquareText } from 'lucide-react';
import { useInRouterContext, useLocation, useNavigate } from 'react-router-dom';
import { FEEDBACK_PATH } from '../../config/navigation';

export const BETA_NOTICE_COPY = {
  link: 'This tool is in beta. We welcome your feedback.',
  detail: 'Please see Feedback in the left-hand menu.',
} as const;

const LINK_CLASS =
  'inline-flex items-center gap-1.5 self-start text-left text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';

function FeedbackLinkButton() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <button
      type="button"
      onClick={() => navigate(FEEDBACK_PATH, { state: { from: location.pathname } })}
      className={LINK_CLASS}
    >
      <MessageSquareText className="h-4 w-4 shrink-0" />
      {BETA_NOTICE_COPY.link}
    </button>
  );
}

interface BetaNoticeProps {
  /**
   * Opens the Feedback page when clicked. Turn it off where a click would leave
   * a pop-up open behind the page, and the line is plain text with the pointer
   * to the menu spelled out.
   */
  clickable?: boolean;
}

export function BetaNotice({ clickable = true }: BetaNoticeProps) {
  const inRouter = useInRouterContext();

  if (clickable && inRouter) return <FeedbackLinkButton />;

  return (
    <p role="note" className="flex items-start gap-1.5 text-sm font-medium text-emerald-700">
      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {BETA_NOTICE_COPY.link} {BETA_NOTICE_COPY.detail}
      </span>
    </p>
  );
}

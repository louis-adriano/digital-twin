'use client';

export function ChatTriggerButton() {
  const handleClick = () => {
    const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
    if (chatButton) chatButton.click();
  };

  return (
    <button
      onClick={handleClick}
      className="bg-primary-foreground text-primary px-8 py-4 rounded-[30px] font-semibold text-[0.95rem] transition-all hover:-translate-y-0.5 hover:shadow-lg self-start"
    >
      Start a conversation
    </button>
  );
}

export default ChatTriggerButton;

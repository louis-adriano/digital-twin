'use client';

export function ConnectButton() {
  const handleClick = () => {
    const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
    if (chatButton) chatButton.click();
  };

  return (
    <button
      onClick={handleClick}
      className="bg-primary-foreground text-primary px-10 py-4 rounded-[30px] font-semibold text-[0.95rem] inline-block transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]"
    >
      Start a conversation
    </button>
  );
}

export default ConnectButton;

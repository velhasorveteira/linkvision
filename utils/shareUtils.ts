
export const shareContent = async (title: string, text: string, url: string = window.location.href) => {
  const shareData = {
    title,
    text,
    url,
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return { success: true, method: 'api' };
    } else {
      // Fallback: Copy to clipboard
      const fullText = `${title}\n\n${text}\n\nVeja mais em: ${url}`;
      await navigator.clipboard.writeText(fullText);
      return { success: true, method: 'clipboard' };
    }
  } catch (err) {
    console.error('Erro ao compartilhar:', err);
    return { success: false };
  }
};

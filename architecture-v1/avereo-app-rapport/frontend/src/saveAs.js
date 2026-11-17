let authorizeDownload = null;

export function setDownloadAuthorization(authorize) {
  authorizeDownload = authorize;
  return () => { if (authorizeDownload === authorize) authorizeDownload = null; };
}

export async function checkDownloadAuthorization() {
  return authorizeDownload ? Boolean(await authorizeDownload()) : true;
}

export async function saveAs(blob, fileName) {
  if (!await checkDownloadAuthorization()) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}

export function pdfContentDisposition(request: Request, filename: string) {
  const disposition = new URL(request.url).searchParams.get("download") === "1"
    ? "attachment"
    : "inline";
  return `${disposition}; filename="${filename}"`;
}

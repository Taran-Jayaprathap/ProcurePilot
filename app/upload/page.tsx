import { FileDropzone } from "@/components/file-dropzone";
import { Badge } from "@/components/ui/badge";

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="muted">Step 1</Badge>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl">
            Build the procurement review room.
          </h1>
        </div>
        <p className="max-w-md text-lg leading-8 text-slate-400">
          Upload three procurement documents. Demo mode loads realistic vendor
          PDFs instantly so the AI workflow can run without setup.
        </p>
      </div>
      <FileDropzone />
    </main>
  );
}

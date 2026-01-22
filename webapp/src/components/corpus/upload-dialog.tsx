"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface UploadDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onUpload?: (file: File, metadata: DocumentMetadata) => void
}

interface DocumentMetadata {
  title: string
  authors: string
  year: string
  institution: string
  discipline: string
  subdiscipline: string
  keywords: string
}

export function UploadDialog({ open: externalOpen, onOpenChange: externalOnOpenChange, onUpload }: UploadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    title: "",
    authors: "",
    year: new Date().getFullYear().toString(),
    institution: "",
    discipline: "INGENIERIA",
    subdiscipline: "",
    keywords: "",
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file && onUpload) {
      onUpload(file, metadata)
      setOpen(false)
      setFile(null)
      setMetadata({
        title: "",
        authors: "",
        year: new Date().getFullYear().toString(),
        institution: "",
        discipline: "INGENIERIA",
        subdiscipline: "",
        keywords: "",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Academic Document</DialogTitle>
          <DialogDescription>
            Upload a PDF or DOCX document to add to the academic corpus.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop a file here, or click to select
                </p>
                <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX up to 50MB</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="authors">Authors *</Label>
              <Input
                id="authors"
                value={metadata.authors}
                onChange={(e) => setMetadata({ ...metadata, authors: e.target.value })}
                placeholder="Comma-separated"
                required
              />
            </div>

            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={metadata.year}
                onChange={(e) => setMetadata({ ...metadata, year: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="institution">Institution *</Label>
              <Input
                id="institution"
                value={metadata.institution}
                onChange={(e) => setMetadata({ ...metadata, institution: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="discipline">Discipline *</Label>
              <Select
                value={metadata.discipline}
                onValueChange={(value) => setMetadata({ ...metadata, discipline: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INGENIERIA">Ingeniería</SelectItem>
                  <SelectItem value="CIENCIAS_SOCIALES">Ciencias Sociales</SelectItem>
                  <SelectItem value="EXACTAS_NATURALES">Exactas y Naturales</SelectItem>
                  <SelectItem value="AGRARIAS">Agrarias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subdiscipline">Subdiscipline *</Label>
              <Input
                id="subdiscipline"
                value={metadata.subdiscipline}
                onChange={(e) => setMetadata({ ...metadata, subdiscipline: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={metadata.keywords}
                onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                placeholder="Comma-separated"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || !metadata.title}>
              Upload Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

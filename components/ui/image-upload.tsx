"use client"

import * as React from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export interface ImageUploadProps {
  value?: string | null
  onChange?: (file: File | null) => void
  onRemove?: () => void
  disabled?: boolean
  className?: string
  maxSizeMB?: number
  accept?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  maxSizeMB = 5,
  accept = "image/jpeg,image/png,image/webp,image/jpg",
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value || null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (value) {
      setPreview(value)
    } else {
      setPreview(null)
    }
  }, [value])

  const validateFile = (file: File): boolean => {
    setError(null)
    
    // Check file type
    const validTypes = accept.split(',').map(t => t.trim())
    const isValidType = validTypes.some(type => {
      if (type.includes('*')) return true
      return file.type === type || file.name.toLowerCase().endsWith(type.split('/')[1])
    })
    
    if (!isValidType) {
      setError(`Invalid file type. Please upload an image (JPG, PNG, or WEBP).`)
      return false
    }
    
    // Check file size (5MB default)
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`)
      return false
    }
    
    return true
  }

  const handleFile = (file: File) => {
    if (!validateFile(file)) {
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    onChange?.(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setError(null)
    onChange?.(null)
    onRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  // Normalize preview to a src that next/image accepts
  const normalizedPreview = React.useMemo(() => {
    if (!preview) return null

    // Data URLs are fine as-is
    if (preview.startsWith("data:")) return preview

    // Absolute URLs
    if (preview.startsWith("http://") || preview.startsWith("https://")) return preview

    // Normalize relative /uploads paths to API origin so Next can fetch them
    let path = preview
    if (!path.startsWith("/")) {
      path = `/${path}`
    }

    if (path.startsWith("/uploads/")) {
      const base = process.env.NEXT_PUBLIC_API_URL
      if (base) {
        try {
          const url = new URL(base)
          return `${url.origin}${path}`
        } catch {
          // fall through to return path
        }
      }
    }

    return path
  }, [preview])

  return (
    <div className={cn("w-full", className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragging && "border-primary bg-accent",
          disabled && "opacity-50 cursor-not-allowed hover:border-dashed hover:bg-transparent",
          error && "border-destructive",
          preview && "border-solid"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        {normalizedPreview ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
            <Image
              width={100}
              height={100}
              src={normalizedPreview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="w-full h-full flex items-center justify-center text-muted-foreground">Failed to load image</div>';
                }
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className={cn(
              "p-4 rounded-full bg-muted mb-4",
              isDragging && "bg-primary/10"
            )}>
              {isDragging ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragging ? "Drop image here" : "Drag & drop an image"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WEBP (max {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}


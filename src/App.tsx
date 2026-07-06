import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './App.module.css'
import {
  createImageItem,
  exportImagesToPdf,
  isImageFile,
  revokeImageItem,
  type ImageItem,
  type PageFormat,
} from './utils/pdf'

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [format, setFormat] = useState<PageFormat>('a4')
  const [marginMm, setMarginMm] = useState(10)
  const [dragActive, setDragActive] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error })
    window.setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(revokeImageItem)
    }
  }, [])

  const addFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(isImageFile)
    if (imageFiles.length === 0) {
      showToast('No supported images found', true)
      return
    }

    try {
      const items = await Promise.all(imageFiles.map(createImageItem))
      setImages((prev) => [...prev, ...items])
      showToast(`Added ${items.length} image${items.length === 1 ? '' : 's'}`)
    } catch {
      showToast('Failed to load one or more images', true)
    }
  }

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void addFiles(event.target.files)
    event.target.value = ''
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
    if (event.dataTransfer.files.length > 0) void addFiles(event.dataTransfer.files)
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id)
      if (item) revokeImageItem(item)
      return prev.filter((img) => img.id !== id)
    })
  }

  const clearAll = () => {
    images.forEach(revokeImageItem)
    setImages([])
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => moveItem(prev, index, index + direction))
  }

  const handleExport = async () => {
    if (images.length === 0) return
    setExporting(true)
    try {
      await exportImagesToPdf(images, {
        format,
        marginMm,
        filename: 'images.pdf',
      })
      showToast('PDF downloaded')
    } catch {
      showToast('Failed to create PDF', true)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            ◈
          </span>
          <div>
            <h1 className={styles.title}>Img2PDF</h1>
            <p className={styles.subtitle}>Upload images, export as PDF</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div
          className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault()
            setDragActive(false)
          }}
          onDrop={onDrop}
        >
          <p className={styles.dropzoneTitle}>Drop images here</p>
          <p className={styles.dropzoneHint}>JPEG, PNG, WebP, GIF, or BMP — processed locally in your browser</p>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: '1rem' }} onClick={() => inputRef.current?.click()}>
            Choose files
          </button>
          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
            multiple
            onChange={onInputChange}
          />
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <label className={styles.field}>
              Page
              <select value={format} onChange={(e) => setFormat(e.target.value as PageFormat)}>
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </label>
            <label className={styles.field}>
              Margin
              <select value={marginMm} onChange={(e) => setMarginMm(Number(e.target.value))}>
                <option value={0}>None</option>
                <option value={10}>10 mm</option>
                <option value={20}>20 mm</option>
              </select>
            </label>
          </div>
          <div className={styles.toolbarGroup}>
            <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={clearAll} disabled={images.length === 0}>
              Clear all
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void handleExport()} disabled={images.length === 0 || exporting}>
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        </div>

        {images.length === 0 ? (
          <p className={styles.empty}>No images yet. Add some above to build your PDF.</p>
        ) : (
          <div className={styles.grid}>
            {images.map((item, index) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.preview}>
                  <img src={item.previewUrl} alt={item.name} />
                </div>
                <p className={styles.meta} title={item.name}>
                  {item.name} · {item.width}×{item.height}
                </p>
                <div className={styles.actions}>
                  <button type="button" className={styles.iconBtn} onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" className={styles.iconBtn} onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Move down">
                    ↓
                  </button>
                  <button type="button" className={`${styles.iconBtn} ${styles.removeBtn}`} onClick={() => removeImage(item.id)} aria-label="Remove">
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        Built by{' '}
        <a href="https://wu101.com" rel="me noopener noreferrer">
          Wu Jiayi
        </a>
        . Nothing leaves your browser.
      </footer>

      {toast ? (
        <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`} role="status">
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}

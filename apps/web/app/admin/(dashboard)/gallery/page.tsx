"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Eye, EyeOff, ImagePlus, Images, Pencil, Plus, Trash2 } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card-custom"
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { createClient } from "@/lib/supabase"
import { notifyError, notifySuccess } from "@/lib/toast"

/**
 * Parish gallery management.
 *
 * Photographs live in the public `gallery` bucket; rows in `gallery_albums` / `gallery_images`
 * decide what the mobile app shows. An album is unpublished by default so a half-uploaded set of
 * photographs is never visible to parishioners mid-upload.
 *
 * Deleting removes the storage object as well as the row. Leaving orphaned objects in a public
 * bucket means a photograph the parish believes it has removed is still fetchable by URL.
 */

const GALLERY_BUCKET = "gallery"
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

interface GalleryImage {
  id: string
  album_id: string
  storage_path: string
  caption: string | null
  width: number | null
  height: number | null
  sort_order: number
}

interface GalleryAlbum {
  id: string
  title: string
  description: string | null
  event_date: string | null
  published: boolean
  sort_order: number
  gallery_images: GalleryImage[]
}

/** Read an image's intrinsic size so the mobile grid can reserve space before it loads. */
const readImageSize = (file: File): Promise<{ width: number | null; height: number | null }> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    // Dimensions are a nice-to-have, not a reason to fail an upload.
    img.onerror = () => {
      resolve({ width: null, height: null })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })

export default function GalleryPage() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null)
  const [albumForm, setAlbumForm] = useState({ title: "", description: "", eventDate: "" })
  const [albumError, setAlbumError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [uploadingAlbumId, setUploadingAlbumId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetAlbum = useRef<string | null>(null)

  const [pendingDeleteAlbum, setPendingDeleteAlbum] = useState<GalleryAlbum | null>(null)
  const [pendingDeleteImage, setPendingDeleteImage] = useState<GalleryImage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  const publicUrl = useCallback(
    (path: string) => supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const fetchAlbums = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("gallery_albums")
      .select("*, gallery_images (*)")
      .order("event_date", { ascending: false, nullsFirst: false })

    if (error) {
      setLoadError("We couldn't load the gallery.")
      setAlbums([])
    } else {
      setLoadError(null)
      setAlbums(
        (data ?? []).map((album: GalleryAlbum) => ({
          ...album,
          gallery_images: [...(album.gallery_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
        }))
      )
    }
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  const openCreateAlbum = () => {
    setEditingAlbum(null)
    setAlbumForm({ title: "", description: "", eventDate: "" })
    setAlbumError(null)
    setIsAlbumModalOpen(true)
  }

  const openEditAlbum = (album: GalleryAlbum) => {
    setEditingAlbum(album)
    setAlbumForm({
      title: album.title,
      description: album.description ?? "",
      eventDate: album.event_date ?? "",
    })
    setAlbumError(null)
    setIsAlbumModalOpen(true)
  }

  const handleSaveAlbum = async () => {
    if (!albumForm.title.trim()) {
      setAlbumError("Give the album a title, for example “Easter Vigil 2026”.")
      return
    }

    setIsSaving(true)
    const payload = {
      title: albumForm.title.trim(),
      description: albumForm.description.trim() || null,
      event_date: albumForm.eventDate || null,
    }

    const { error } = editingAlbum
      ? await supabase.from("gallery_albums").update(payload).eq("id", editingAlbum.id)
      : await supabase.from("gallery_albums").insert(payload)

    setIsSaving(false)

    if (error) {
      notifyError(editingAlbum ? "We couldn't update that album." : "We couldn't create that album.", error)
      return
    }

    notifySuccess(editingAlbum ? "Album updated" : "Album created", payload.title)
    setIsAlbumModalOpen(false)
    fetchAlbums()
  }

  const togglePublished = async (album: GalleryAlbum) => {
    const next = !album.published
    const { error } = await supabase.from("gallery_albums").update({ published: next }).eq("id", album.id)

    if (error) {
      notifyError("We couldn't change whether that album is visible.", error)
      return
    }

    notifySuccess(
      next ? "Album published" : "Album hidden",
      next ? `${album.title} is now visible in the app.` : `${album.title} is no longer visible in the app.`
    )
    fetchAlbums()
  }

  const promptUpload = (albumId: string) => {
    uploadTargetAlbum.current = albumId
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const albumId = uploadTargetAlbum.current
    const files = Array.from(event.target.files ?? [])
    // Reset immediately so picking the same file twice in a row still fires a change event.
    event.target.value = ""
    if (!albumId || files.length === 0) return

    const album = albums.find((a) => a.id === albumId)
    const startingOrder = (album?.gallery_images.length ?? 0)

    setUploadingAlbumId(albumId)
    setUploadProgress({ done: 0, total: files.length })

    let succeeded = 0
    const failures: string[] = []

    for (const [index, file] of files.entries()) {
      // Checked here as well as by the bucket so the person gets a filename, not a generic 400.
      if (!ACCEPTED_TYPES.includes(file.type)) {
        failures.push(`${file.name} (unsupported format)`)
        setUploadProgress({ done: index + 1, total: files.length })
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        failures.push(`${file.name} (larger than 10 MB)`)
        setUploadProgress({ done: index + 1, total: files.length })
        continue
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `albums/${albumId}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from(GALLERY_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) {
        failures.push(file.name)
        setUploadProgress({ done: index + 1, total: files.length })
        continue
      }

      const { width, height } = await readImageSize(file)
      const { error: rowError } = await supabase.from("gallery_images").insert({
        album_id: albumId,
        storage_path: path,
        width,
        height,
        sort_order: startingOrder + index,
      })

      if (rowError) {
        // The object uploaded but the row did not, so nothing references it. Remove it rather than
        // leaving a photograph sitting in a public bucket that the parish cannot see or delete.
        await supabase.storage.from(GALLERY_BUCKET).remove([path])
        failures.push(file.name)
      } else {
        succeeded++
      }

      setUploadProgress({ done: index + 1, total: files.length })
    }

    setUploadingAlbumId(null)
    setUploadProgress(null)
    uploadTargetAlbum.current = null

    if (succeeded > 0) {
      notifySuccess(`${succeeded} photograph${succeeded === 1 ? "" : "s"} added`)
    }
    if (failures.length > 0) {
      notifyError(`${failures.length} photograph${failures.length === 1 ? "" : "s"} could not be uploaded: ${failures.join(", ")}`)
    }

    fetchAlbums()
  }

  const saveCaption = async (image: GalleryImage, caption: string) => {
    const trimmed = caption.trim()
    if ((image.caption ?? "") === trimmed) return

    const { error } = await supabase
      .from("gallery_images")
      .update({ caption: trimmed || null })
      .eq("id", image.id)

    if (error) {
      notifyError("We couldn't save that caption.", error)
      return
    }
    setAlbums((current) =>
      current.map((album) => ({
        ...album,
        gallery_images: album.gallery_images.map((i) =>
          i.id === image.id ? { ...i, caption: trimmed || null } : i
        ),
      }))
    )
  }

  const handleDeleteImage = async () => {
    if (!pendingDeleteImage) return
    setIsDeleting(true)

    const { error } = await supabase.from("gallery_images").delete().eq("id", pendingDeleteImage.id)
    if (!error) {
      // Row first, then the object: if the object removal fails the photograph is already invisible
      // to parishioners, which is the outcome that matters.
      await supabase.storage.from(GALLERY_BUCKET).remove([pendingDeleteImage.storage_path])
    }

    setIsDeleting(false)
    setPendingDeleteImage(null)

    if (error) {
      notifyError("We couldn't remove that photograph.", error)
      return
    }
    notifySuccess("Photograph removed")
    fetchAlbums()
  }

  const handleDeleteAlbum = async () => {
    if (!pendingDeleteAlbum) return
    setIsDeleting(true)

    const paths = pendingDeleteAlbum.gallery_images.map((i) => i.storage_path)
    // `on delete cascade` clears the image rows; the storage objects are ours to clean up.
    const { error } = await supabase.from("gallery_albums").delete().eq("id", pendingDeleteAlbum.id)
    if (!error && paths.length > 0) {
      await supabase.storage.from(GALLERY_BUCKET).remove(paths)
    }

    setIsDeleting(false)
    setPendingDeleteAlbum(null)

    if (error) {
      notifyError("We couldn't delete that album.", error)
      return
    }
    notifySuccess("Album deleted")
    fetchAlbums()
  }

  return (
    <AdminPage
      title="Gallery"
      subtitle="Photographs from parish life"
      navbarActions={
        <Button onClick={openCreateAlbum}>
          <Plus className="h-4 w-4" />
          New album
        </Button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      <div className="space-y-6">
        {isLoading ? (
          <AdminPageSkeleton rows={3} />
        ) : loadError ? (
          <Card>
            <CardContent className="space-y-4 pt-6 text-center">
              <p className="font-semibold">{loadError}</p>
              <Button variant="outline" onClick={fetchAlbums}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : albums.length === 0 ? (
          <EmptyState
            icon={<Images className="h-6 w-6" />}
            title="No albums yet"
            description="Group photographs by celebration — a harvest, a confirmation, a feast day — so parishioners can find them. Albums stay hidden until you publish them."
            action={
              <Button onClick={openCreateAlbum}>
                <Plus className="h-4 w-4" />
                Create the first album
              </Button>
            }
          />
        ) : (
          albums.map((album) => (
            <Card key={album.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl font-semibold">{album.title}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          album.published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-surface-container-low text-foreground/60"
                        }`}
                      >
                        {album.published ? "Visible in app" : "Hidden"}
                      </span>
                    </div>
                    {album.event_date ? (
                      <p className="text-sm text-foreground/70">
                        {new Date(`${album.event_date}T12:00:00`).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    ) : null}
                    {album.description ? (
                      <p className="mt-1 text-sm text-foreground/70">{album.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-foreground/55">
                      {album.gallery_images.length} photograph{album.gallery_images.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => promptUpload(album.id)}
                      disabled={uploadingAlbumId !== null}
                    >
                      <ImagePlus className="h-4 w-4" />
                      {uploadingAlbumId === album.id && uploadProgress
                        ? `Uploading ${uploadProgress.done}/${uploadProgress.total}`
                        : "Add photographs"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(album)}
                      disabled={album.gallery_images.length === 0 && !album.published}
                      title={
                        album.gallery_images.length === 0 && !album.published
                          ? "Add at least one photograph before publishing"
                          : undefined
                      }
                    >
                      {album.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {album.published ? "Hide" : "Publish"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditAlbum(album)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPendingDeleteAlbum(album)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                {album.gallery_images.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-outline/30 px-4 py-8 text-center text-sm text-foreground/60">
                    No photographs in this album yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {album.gallery_images.map((image) => (
                      <div key={image.id} className="space-y-2">
                        <div className="relative overflow-hidden rounded-xl border border-outline/20 bg-surface-container-low">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={publicUrl(image.storage_path)}
                            alt={image.caption ?? "Parish photograph"}
                            className="aspect-square w-full object-cover"
                            loading="lazy"
                          />
                          <button
                            type="button"
                            aria-label="Remove this photograph"
                            onClick={() => setPendingDeleteImage(image)}
                            className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white transition hover:bg-black/75"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Input
                          aria-label="Caption"
                          defaultValue={image.caption ?? ""}
                          placeholder="Add a caption"
                          // Saved on blur rather than per keystroke: a caption is a short, deliberate
                          // edit, and a write per character would be a request per character.
                          onBlur={(event) => saveCaption(image, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal open={isAlbumModalOpen} onOpenChange={setIsAlbumModalOpen}>
        <ModalHeader>
          <ModalTitle>{editingAlbum ? "Edit album" : "New album"}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            <div>
              <label htmlFor="album-title" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-foreground/70">
                Title
              </label>
              <Input
                id="album-title"
                value={albumForm.title}
                placeholder="Easter Vigil 2026"
                onChange={(event) => setAlbumForm((f) => ({ ...f, title: event.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="album-date" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-foreground/70">
                Date of the celebration
              </label>
              <Input
                id="album-date"
                type="date"
                value={albumForm.eventDate}
                onChange={(event) => setAlbumForm((f) => ({ ...f, eventDate: event.target.value }))}
              />
              <p className="mt-1 text-xs text-foreground/60">
                Albums are ordered by this date, not by when they were uploaded.
              </p>
            </div>

            <div>
              <label htmlFor="album-description" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-foreground/70">
                Description (optional)
              </label>
              <Textarea
                id="album-description"
                rows={3}
                value={albumForm.description}
                onChange={(event) => setAlbumForm((f) => ({ ...f, description: event.target.value }))}
              />
            </div>

            {albumError ? (
              <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error" role="alert">
                {albumError}
              </div>
            ) : null}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsAlbumModalOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveAlbum} disabled={isSaving}>
            {isSaving ? "Saving..." : editingAlbum ? "Save changes" : "Create album"}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={pendingDeleteAlbum !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteAlbum(null)
        }}
        title="Delete this album?"
        description={`“${pendingDeleteAlbum?.title}” and its ${pendingDeleteAlbum?.gallery_images.length ?? 0} photograph(s) will be permanently deleted from the app and from storage.`}
        confirmLabel="Delete album"
        isPending={isDeleting}
        onConfirm={handleDeleteAlbum}
      />

      <ConfirmDialog
        open={pendingDeleteImage !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteImage(null)
        }}
        title="Remove this photograph?"
        description="It will be permanently deleted from the album and from storage."
        confirmLabel="Remove photograph"
        isPending={isDeleting}
        onConfirm={handleDeleteImage}
      />
    </AdminPage>
  )
}

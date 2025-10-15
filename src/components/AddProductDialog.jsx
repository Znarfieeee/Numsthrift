import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, X, Upload, ImageIcon } from 'lucide-react'

export function AddProductDialog({ trigger, onSuccess }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  // Initialize form data from sessionStorage if available
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('addProductFormData')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {
          title: '',
          description: '',
          price: '',
          quantity: '1',
          category_id: '',
          condition: 'good',
          brand: '',
          size: '',
        }
      }
    }
    return {
      title: '',
      description: '',
      price: '',
      quantity: '1',
      category_id: '',
      condition: 'good',
      brand: '',
      size: '',
    }
  })

  // Restore image previews from sessionStorage on mount
  useEffect(() => {
    const savedPreviews = sessionStorage.getItem('addProductImagePreviews')
    if (savedPreviews) {
      try {
        const previews = JSON.parse(savedPreviews)
        setImagePreviews(previews)

        // Convert base64 previews back to File objects
        const convertedFiles = []
        previews.forEach(async (preview, index) => {
          const blob = await fetch(preview).then((r) => r.blob())
          const file = new File([blob], `restored-image-${index}.jpg`, { type: blob.type })
          convertedFiles.push(file)

          if (convertedFiles.length === previews.length) {
            setImageFiles(convertedFiles)
          }
        })
      } catch {
        // Ignore errors
      }
    }
  }, [])

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    if (open) {
      sessionStorage.setItem('addProductFormData', JSON.stringify(formData))
    }
  }, [formData, open])

  // Save image previews to sessionStorage whenever they change
  useEffect(() => {
    if (open && imagePreviews.length > 0) {
      sessionStorage.setItem('addProductImagePreviews', JSON.stringify(imagePreviews))
    }
  }, [imagePreviews, open])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name').order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Limit to 5 images
    if (imageFiles.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error(`${file.name} exceeds 5MB limit`)
        return false
      }
      return true
    })

    // Store files with previews
    const newPreviews = []
    for (const file of validFiles) {
      const reader = new FileReader()
      const preview = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
      newPreviews.push(preview)
    }

    setImageFiles((prev) => [...prev, ...validFiles])
    setImagePreviews((prev) => [...prev, ...newPreviews])

    // Save to sessionStorage
    sessionStorage.setItem('addProductImagePreviews', JSON.stringify([...imagePreviews, ...newPreviews]))
  }

  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index)
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index)

    setImageFiles(newImageFiles)
    setImagePreviews(newImagePreviews)

    // Update sessionStorage
    if (newImagePreviews.length > 0) {
      sessionStorage.setItem('addProductImagePreviews', JSON.stringify(newImagePreviews))
    } else {
      sessionStorage.removeItem('addProductImagePreviews')
    }
  }

  const uploadImages = async () => {
    if (imageFiles.length === 0) return { mainImage: null, additionalImages: [] }

    setUploading(true)
    const uploadedUrls = []

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) throw error

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('product-images').getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      return {
        mainImage: uploadedUrls[0],
        additionalImages: uploadedUrls.slice(1),
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      quantity: '1',
      category_id: '',
      condition: 'good',
      brand: '',
      size: '',
    })
    setImageFiles([])
    setImagePreviews([])

    // Clear sessionStorage
    sessionStorage.removeItem('addProductFormData')
    sessionStorage.removeItem('addProductImagePreviews')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    if (imageFiles.length === 0) {
      toast.error('Please add at least one product image')
      return
    }

    setLoading(true)

    try {
      // Upload images first
      const { mainImage, additionalImages } = await uploadImages()

      // Insert product
      const { error } = await supabase.from('products').insert({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category_id: formData.category_id || null,
        condition: formData.condition,
        brand: formData.brand || null,
        size: formData.size || null,
        image_url: mainImage,
        additional_images: additionalImages.length > 0 ? additionalImages : null,
        seller_id: user.id,
        status: 'available',
      })

      if (error) throw error

      toast.success('Product added successfully!')
      resetForm()
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Error adding product: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]"
        onInteractOutside={(e) => {
          if (loading || uploading) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (loading || uploading) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new product to your store.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Product Images *</Label>
              <span className="text-muted-foreground text-xs">Max 5 images, 5MB each</span>
            </div>

            {/* Upload Button */}
            <div className="flex gap-2">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload').click()}
                className="w-full"
                disabled={imageFiles.length >= 5}
              >
                <Upload className="mr-2 h-4 w-4" />
                {imageFiles.length === 0 ? 'Upload Images' : `Add More (${imageFiles.length}/5)`}
              </Button>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="group relative aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full rounded-lg border-2 border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white opacity-100 shadow-lg transition-colors hover:bg-red-600"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="text-xs font-semibold text-white">Main Image</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Helper text */}
            {imageFiles.length === 0 && (
              <p className="text-muted-foreground text-xs">
                First image will be the main product image. Supported formats: JPG, PNG, WEBP
              </p>
            )}
          </div>

          <div className="border-t pt-6"></div>

          {/* Basic Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Basic Information</Label>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter product title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product in detail"
                rows={3}
                required
              />
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₱) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6"></div>

          {/* Product Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Product Details</Label>

            {/* Category and Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Brand and Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Nike, Apple"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  placeholder="e.g., M, L, XL"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? (uploading ? 'Uploading...' : 'Adding...') : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

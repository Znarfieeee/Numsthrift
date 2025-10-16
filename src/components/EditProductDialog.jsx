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
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { X, Upload } from 'lucide-react'

export function EditProductDialog({ product, open, onOpenChange, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '1',
    category_id: '',
    condition: 'good',
    brand: '',
    size: '',
  })

  // Load product data when dialog opens
  useEffect(() => {
    if (open && product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '1',
        category_id: product.category_id || '',
        condition: product.condition || 'good',
        brand: product.brand || '',
        size: product.size || '',
      })

      // Set existing images
      const images = []
      if (product.image_url) images.push(product.image_url)
      if (product.additional_images && Array.isArray(product.additional_images)) {
        images.push(...product.additional_images)
      }
      setExistingImages(images)
      setImageFiles([])
      setImagePreviews([])
    }
  }, [open, product])

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

    // Limit to 5 images total
    const totalImages = existingImages.length + imageFiles.length + files.length
    if (totalImages > 5) {
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
  }

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    if (imageFiles.length === 0) return []

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

      return uploadedUrls
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    const totalImages = existingImages.length + imageFiles.length
    if (totalImages === 0) {
      toast.error('Please add at least one product image')
      return
    }

    setLoading(true)

    try {
      // Upload new images if any
      const newImageUrls = await uploadImages()

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls]
      const mainImage = allImages[0]
      const additionalImages = allImages.slice(1)

      // Update product
      const { error } = await supabase
        .from('products')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (error) throw error

      toast.success('Product updated successfully!')
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Error updating product: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const totalImageCount = existingImages.length + imageFiles.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update the details of your product.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Product Images *</Label>
              <span className="text-muted-foreground text-xs">Max 5 images, 5MB each</span>
            </div>

            {/* Existing and New Images */}
            <div className="mt-2 grid grid-cols-3 gap-3">
              {/* Existing images */}
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} className="group relative aspect-square">
                  <img
                    src={url}
                    alt={`Existing ${index + 1}`}
                    className="h-full w-full rounded-lg border-2 border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white opacity-100 shadow-lg transition-colors hover:bg-red-600"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && existingImages.length > 0 && (
                    <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent p-2">
                      <span className="text-xs font-semibold text-white">Main Image</span>
                    </div>
                  )}
                </div>
              ))}

              {/* New image previews */}
              {imagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="group relative aspect-square">
                  <img
                    src={preview}
                    alt={`New ${index + 1}`}
                    className="h-full w-full rounded-lg border-2 border-blue-300 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white opacity-100 shadow-lg transition-colors hover:bg-red-600"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-blue-700/70 to-transparent p-2">
                    <span className="text-xs font-semibold text-white">New</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="flex gap-2">
              <input
                type="file"
                id="image-upload-edit"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload-edit').click()}
                className="w-full"
                disabled={totalImageCount >= 5}
              >
                <Upload className="mr-2 h-4 w-4" />
                {totalImageCount === 0
                  ? 'Upload Images'
                  : `Add More (${totalImageCount}/5)`}
              </Button>
            </div>

            {/* Helper text */}
            <p className="text-muted-foreground text-xs">
              First image will be the main product image. Blue border indicates new images.
            </p>
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
                    <SelectItem value="brand_new">Brand New with Tags</SelectItem>
                    <SelectItem value="like_new">Like New (Barely Worn)</SelectItem>
                    <SelectItem value="excellent">Excellent (Gently Used)</SelectItem>
                    <SelectItem value="good">Good (Minor Signs of Wear)</SelectItem>
                    <SelectItem value="fair">Fair (Noticeable Wear)</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Brand and Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand (Optional)</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., H&M, Zara, Uniqlo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, size: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XXS">XXS</SelectItem>
                    <SelectItem value="XS">XS</SelectItem>
                    <SelectItem value="S">S (Small)</SelectItem>
                    <SelectItem value="M">M (Medium)</SelectItem>
                    <SelectItem value="L">L (Large)</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                    <SelectItem value="XXL">XXL</SelectItem>
                    <SelectItem value="XXXL">XXXL</SelectItem>
                    <SelectItem value="Free Size">Free Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? (uploading ? 'Uploading...' : 'Updating...') : 'Update Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

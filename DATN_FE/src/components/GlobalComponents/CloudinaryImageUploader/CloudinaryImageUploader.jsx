import React, { useRef, useState, useCallback } from 'react'
import { FaCloudUploadAlt, FaTimes, FaImage } from 'react-icons/fa'
import { MdOutlineAddPhotoAlternate } from 'react-icons/md'

const CLOUD_NAME = 'da9cghklv'
const UPLOAD_PRESET = 'fedacn_unsigned'

const CloudinaryImageUploader = ({
    value = '',
    onChange,
    error = null,
    label = 'Ảnh bìa',
    required = false,
    folder = 'sport-events'
}) => {
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const inputRef = useRef(null)

    const uploadToCloudinary = useCallback(async (file) => {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            alert('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, ...)')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('Ảnh tối đa 10MB')
            return
        }
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', UPLOAD_PRESET)
            formData.append('folder', folder)
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            )
            if (!res.ok) throw new Error('Upload thất bại')
            const data = await res.json()
            onChange(data.secure_url)
        } catch (err) {
            console.error(err)
            alert('Upload ảnh thất bại. Vui lòng thử lại.')
        } finally {
            setUploading(false)
        }
    }, [folder, onChange])

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) uploadToCloudinary(file)
        e.target.value = ''
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) uploadToCloudinary(file)
    }

    const handleRemove = (e) => {
        e.stopPropagation()
        onChange('')
    }

    // Border color: dragover → green, error → red, default → gray
    const zoneBorderColor = dragOver ? '#22c55e' : error ? '#f87171' : '#d1d5db'
    const zoneBg = dragOver ? '#f0fdf4' : error ? '#fff5f5' : '#f9fafb'

    return (
        <div>
            {label && (
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}

            {value ? (
                /* ── Preview mode ── */
                <div
                    className="group"
                    style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '2px solid #e5e7eb' }}
                >
                    <img
                        src={value}
                        alt="preview"
                        style={{ width: '100%', height: 192, objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.src = 'https://placehold.co/800x400?text=Lỗi+ảnh' }}
                    />
                    {/* Overlay */}
                    <div
                        className="group-hover:opacity-100"
                        style={{
                            position: 'absolute', inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            opacity: 0, transition: 'opacity 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: '#fff', color: '#1f2937',
                                fontWeight: 700, fontSize: 13, padding: '8px 16px',
                                borderRadius: 12, border: 'none', cursor: 'pointer'
                            }}
                        >
                            <FaCloudUploadAlt /> Đổi ảnh
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: '#ef4444', color: '#fff',
                                fontWeight: 700, fontSize: 13, padding: '8px 16px',
                                borderRadius: 12, border: 'none', cursor: 'pointer'
                            }}
                        >
                            <FaTimes /> Xóa
                        </button>
                    </div>

                    {uploading && (
                        <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}>
                            <div style={{
                                width: 32, height: 32,
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Đang tải lên hình ảnh...</span>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Upload zone ── */
                <div
                    onClick={() => !uploading && inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                        width: '100%', height: 192,
                        border: `2px dashed ${zoneBorderColor}`,
                        borderRadius: 16,
                        backgroundColor: zoneBg,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 12,
                        cursor: uploading ? 'wait' : 'pointer',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                    }}
                >
                    {uploading ? (
                        <>
                            <div style={{
                                width: 40, height: 40,
                                border: '3px solid #bbf7d0',
                                borderTopColor: '#16a34a',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', margin: 0 }}>
                                Đang tải lên hình ảnh...
                            </p>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                backgroundColor: dragOver ? '#bbf7d0' : '#f3f4f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {dragOver
                                    ? <FaCloudUploadAlt style={{ fontSize: 24, color: '#16a34a' }} />
                                    : <MdOutlineAddPhotoAlternate style={{ fontSize: 28, color: '#9ca3af' }} />
                                }
                            </div>
                            <div style={{ textAlign: 'center', padding: '0 16px' }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#4b5563', margin: '0 0 4px 0' }}>
                                    {dragOver ? 'Thả ảnh vào đây' : 'Nhấp hoặc kéo thả ảnh'}
                                </p>
                                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                                    JPG, PNG, WEBP • Tối đa 10MB
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {error && (
                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚠ {error}
                </p>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default CloudinaryImageUploader

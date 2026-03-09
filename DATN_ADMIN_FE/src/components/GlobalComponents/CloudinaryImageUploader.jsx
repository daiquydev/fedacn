import React, { useRef, useState, useCallback } from 'react'
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa'
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
        if (!file.type.startsWith('image/')) { alert('Chỉ chấp nhận file ảnh'); return }
        if (file.size > 10 * 1024 * 1024) { alert('Ảnh tối đa 10MB'); return }
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('upload_preset', UPLOAD_PRESET)
            fd.append('folder', folder)
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
            if (!res.ok) throw new Error()
            const data = await res.json()
            onChange(data.secure_url)
        } catch {
            alert('Upload thất bại. Vui lòng thử lại.')
        } finally {
            setUploading(false)
        }
    }, [folder, onChange])

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) uploadToCloudinary(file)
        e.target.value = ''
    }

    const zoneBorderColor = dragOver ? '#3b82f6' : error ? '#f87171' : '#cbd5e1'
    const zoneBg = dragOver ? '#eff6ff' : error ? '#fff5f5' : '#f8fafc'

    return (
        <div>
            {label && (
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}

            {value ? (
                <div className="group" style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img
                        src={value}
                        alt="preview"
                        style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.src = 'https://placehold.co/600x300?text=Lỗi+ảnh' }}
                    />
                    <div
                        className="group-hover:opacity-100"
                        style={{
                            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                            opacity: 0, transition: 'opacity 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', color: '#1f2937', fontWeight: 600, fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                        >
                            <FaCloudUploadAlt /> Đổi ảnh
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange('') }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                        >
                            <FaTimes /> Xóa
                        </button>
                    </div>
                    {uploading && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <div style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ color: '#fff', fontSize: 11 }}>Đang tải lên...</span>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onClick={() => !uploading && inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadToCloudinary(f) }}
                    style={{
                        width: '100%', height: 112,
                        border: `2px dashed ${zoneBorderColor}`,
                        borderRadius: 8, backgroundColor: zoneBg,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 8,
                        cursor: uploading ? 'wait' : 'pointer',
                        transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                >
                    {uploading ? (
                        <>
                            <div style={{ width: 28, height: 28, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', margin: 0 }}>Đang tải lên...</p>
                        </>
                    ) : (
                        <>
                            <MdOutlineAddPhotoAlternate style={{ fontSize: 28, color: dragOver ? '#3b82f6' : '#94a3b8' }} />
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 2px 0' }}>
                                    {dragOver ? 'Thả ảnh vào đây' : 'Nhấp hoặc kéo thả ảnh'}
                                </p>
                                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>JPG, PNG, WEBP • Max 10MB</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

            {error && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠ {error}</p>}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default CloudinaryImageUploader

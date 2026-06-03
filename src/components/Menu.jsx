import React, { useEffect, useRef, useState } from "react";

export default function Menu({ showTexure, setShowTexure, sourceType, setSourceType, textureImage, setTextureImage, imageSource, setImageSource, videoSource, setVideoSource, facemeshTextureFiles, otherModelFiles, textureFolder, imageFiles, imageFolder, videoFiles, videoFolder, thumbnailFolder, basePath: basePath_prop, editMode, setEditMode, savedImages, setSavedImages, importedTextures, setImportedTextures, importedImages, setImportedImages, importedVideos, setImportedVideos, captureMode, setCaptureMode, selectedObjFile, setSelectedObjFile, selectedObjScale, setSelectedObjScale, smoothShading, setSmoothShading }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [creditType, setCreditType] = useState('image');
  const [textureSubmenuOpen, setTextureSubmenuOpen] = useState(false);
  const [imageSubmenuOpen, setImageSubmenuOpen] = useState(false);
  const [videoSubmenuOpen, setVideoSubmenuOpen] = useState(false);
  const importTextureRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const menuRef = useRef(null);
  const basePath = basePath_prop || import.meta.env.BASE_URL;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setTextureSubmenuOpen(false);
        setImageSubmenuOpen(false);
        setVideoSubmenuOpen(false);
      }
    };
    if (menuOpen || textureSubmenuOpen || imageSubmenuOpen || videoSubmenuOpen) {
      document.addEventListener("click", handleOutsideClick);
      return () => document.removeEventListener("click", handleOutsideClick);
    }
  }, [menuOpen, textureSubmenuOpen, imageSubmenuOpen, videoSubmenuOpen]);

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = basePath + 'face_mesh_2d.png';
    link.download = 'face_mesh_2d.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportTexture = (e) => { e.stopPropagation(); importTextureRef.current?.click(); };
  const handleUploadImage = (e) => { e.stopPropagation(); imageInputRef.current?.click(); };
  const handleUploadVideo = (e) => { e.stopPropagation(); videoInputRef.current?.click(); };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImportedTextures([...importedTextures, { id: Date.now(), dataUrl, name: file.name }]);
      setTextureImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImportedImages([...importedImages, { id: Date.now(), dataUrl, name: file.name }]);
      setSourceType("image");
      setImageSource(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const videoDataUrl = event.target.result;
      const video = document.createElement('video');
      video.src = videoDataUrl;
      video.addEventListener('loadedmetadata', () => { video.currentTime = video.duration * 0.1; });
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const thumbnailUrl = canvas.toDataURL('image/png');
        setImportedVideos([...importedVideos, { id: Date.now(), url: videoDataUrl, thumbnail: thumbnailUrl, name: file.name }]);
        setSourceType("video");
        setVideoSource(videoDataUrl);
      });
    };
    reader.readAsDataURL(file);
  };

  const closeSubmenus = () => {
    setTextureSubmenuOpen(false);
    setImageSubmenuOpen(false);
    setVideoSubmenuOpen(false);
  };

  // ---- 共通パーツ関数 ----

  const isSelected = (currentValue, target) =>
    currentValue && currentValue.includes ? currentValue.includes(target) : false;

  const renderToggleRow = (label, value, setValue) => (
    <div className="source-btn toggle-row">
      <span>{label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); setValue(!value); }}
        className={value ? "toggle-btn on" : "toggle-btn off"}
      >
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );

  const renderSubmenuHeader = (title, buttons) => (
    <div className="submenu-header">
      <div className="submenu-title">{title}</div>
      <div className="submenu-header-actions">
        {buttons.map(({ label, onClick }, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); onClick(e); }} className="submenu-header-button">{label}</button>
        ))}
      </div>
    </div>
  );

  const renderGalleryItem = (item, selected, onClick, { showFilm = false } = {}) => (
    <div key={item.filename} className="gallery-item" onClick={(e) => { e.stopPropagation(); onClick(item); }}>
      <div className={selected ? "img_base selected" : "img_base"}>
        <img src={item.thumbnail} alt={item.name} />
        {showFilm && <img src={basePath + 'film.png'} alt="" className="film-overlay" />}
      </div>
      <div className="gallery-item-info">
        <div className="gallery-item-name">{item.name}</div>
        <div className="gallery-item-title">{item.title}</div>
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="gallery-item-link" onClick={(e) => e.stopPropagation()}>
            {item.site}
          </a>
        )}
      </div>
    </div>
  );

  const renderImportedGrid = (items, isSelectedFn, onSelect, onDelete, { showFilm = false } = {}) => (
    items && items.length > 0 && (
      <div className="submenu-popup-grid scrollable">
        {items.map((item) => (
          <div key={item.id} className="gallery-clickable" onClick={(e) => { e.stopPropagation(); onSelect(item); }}>
            <div className="gallery-item-wrapper">
              <div className={isSelectedFn(item) ? "img_base selected" : "img_base"}>
                <img src={item.thumbnail || item.dataUrl} alt={item.name || "saved"} />
                {showFilm && <img src={basePath + 'film.png'} alt="" className="film-overlay" />}
              </div>
              <button className="draw-gallery-delete" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    )
  );

  const renderSourceButton = (type) => {
    const icons = { none: "⊘ None", image: "🖼️ Image", video: "🎞️ Video", camera: "🎥 Camera" };
    const hasSubmenu = type === "image" || type === "video";
    const isOpen = type === "image" ? imageSubmenuOpen : type === "video" ? videoSubmenuOpen : false;

    const handleClick = (e) => {
      e.stopPropagation();
      if (type === "image") { setTextureSubmenuOpen(false); setVideoSubmenuOpen(false); setImageSubmenuOpen(!imageSubmenuOpen); }
      else if (type === "video") { setTextureSubmenuOpen(false); setImageSubmenuOpen(false); setVideoSubmenuOpen(!videoSubmenuOpen); }
      else { setSourceType(type); closeSubmenus(); }
    };

    const checked = (type === "none" || type === "image" || type === "video") && sourceType === type;

    return (
      <button key={type} onClick={handleClick} className={isOpen ? "source-btn active-open" : "source-btn"}>
        {hasSubmenu || type === "none" ? (
          <span className={hasSubmenu ? "btn-content-between" : "source-item-row"}>
            <span className="source-item-row">
              <span className="check-icon">{checked ? "✔" : ""}</span>
              <span>{icons[type]}</span>
            </span>
            {hasSubmenu && <span>&gt;</span>}
          </span>
        ) : icons[type]}
      </button>
    );
  };

  // ---- テクスチャ選択時の共通ハンドラ ----

  const handleTextureSelect = (item) => {
    setTextureImage(basePath + textureFolder + "/" + item.filename);
    if (item.obj) setSelectedObjFile(item.obj);
    setSelectedObjScale(item.scale ?? 1.0);
    setTextureSubmenuOpen(false);
  };

  const facemeshOrigin = (
    renderGalleryItem(facemeshTextureFiles[0], isSelected(textureImage, facemeshTextureFiles[0].filename), handleTextureSelect)
  );

  const facemeshDowinloadBtn = (
    <div className="gallery-item">Download<br />Blueprint</div>
  );

  // ---- render ----
  return (
    <>
      <div ref={menuRef} className="menu-root">
        <div className="menu-trigger" onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); }}>
          ☰ Menu
        </div>

        {menuOpen && (
          <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="section-title">Texture</div>
            <button
              onClick={(e) => { e.stopPropagation(); setTextureSubmenuOpen(!textureSubmenuOpen); setImageSubmenuOpen(false); setVideoSubmenuOpen(false); }}
              className={textureSubmenuOpen ? "source-btn active-open" : "source-btn"}
            >
              <span className="btn-content-between">
                <span>🎨 Texture</span>
                <span>&gt;</span>
              </span>
            </button>
            {renderToggleRow("Show texture", showTexure, setShowTexure)}
            {renderToggleRow("Smooth Shading", smoothShading, setSmoothShading)}

            <div className="section-gap" />
            <div className="section-title">Source</div>
            {["none", "image", "video", "camera"].map(renderSourceButton)}

            <div className="section-gap" />
            <div className="credit-item">
              <div className="credit-label">🧑‍💻 Author</div>
              <div className="credit-text">mo256man</div>
              <a href="https://github.com/mo256man/mediapipe_facemesh_demo" target="_blank" rel="noopener noreferrer" className="credit-link">
                https://github.com/mo256man/mediapipe_facemesh_demo
              </a>
            </div>
          </div>
        )}

        <div className="hidden-inputs">
          <input ref={importTextureRef} type="file" accept="image/*" onChange={handleFileChange} />
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} />
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} />
        </div>

        {/* Texture submenu */}
        {textureSubmenuOpen && (
          <div className="submenu-popup" onClick={(e) => { if (e.target === e.currentTarget) setTextureSubmenuOpen(false); }}>
            {renderSubmenuHeader("Texture", [
              { label: "Import Texture", onClick: handleImportTexture },
              { label: "Download blueprint", onClick: handleDownload },
            ])}
            <div>facemesh texture original</div>
            <div className="submenu-popup-grid">
              {facemeshOrigin}
              {facemeshDowinloadBtn}
                {/* {renderGalleryItem(facemeshTextureFiles[0], isSelected(textureImage, facemeshTextureFiles[0].filename), handleTextureSelect)} */}
            </div>
            <hr />
            <div>facemesh texture</div>
            <div className="submenu-popup-grid">
              {facemeshTextureFiles && facemeshTextureFiles.slice(1).map((item) =>
                renderGalleryItem(item, isSelected(textureImage, item.filename), handleTextureSelect)
              )}
            </div>
            <hr />
            <div>other model</div>
            <div className="submenu-popup-grid">
              {otherModelFiles && otherModelFiles.map((item) =>
                renderGalleryItem(item, isSelected(textureImage, item.filename), handleTextureSelect)
              )}
            </div>
            <hr />
            <div>saved textures</div>
            {renderImportedGrid(
              savedImages,
              (img) => textureImage === img.dataUrl,
              (img) => { setTextureImage(img.dataUrl); setTextureSubmenuOpen(false); },
              (id) => setSavedImages((prev) => prev.filter((i) => i.id !== id))
            )}
            <hr />
            <div>imported textures</div>
            {renderImportedGrid(
              importedTextures,
              (img) => textureImage === img.dataUrl,
              (img) => { setTextureImage(img.dataUrl); setTextureSubmenuOpen(false); },
              (id) => setImportedTextures((prev) => prev.filter((i) => i.id !== id))
            )}
          </div>
        )}

        {/* Image submenu */}
        {imageSubmenuOpen && (
          <div className="submenu-popup" onClick={(e) => { if (e.target === e.currentTarget) setImageSubmenuOpen(false); }}>
            {renderSubmenuHeader("Image", [
              { label: "Import Image", onClick: handleUploadImage },
            ])}
            <hr />
            <div className="submenu-popup-grid">
              {imageFiles && imageFiles.map((item) =>
                renderGalleryItem(
                  item,
                  isSelected(imageSource, item.filename),
                  (it) => { setSourceType("image"); setImageSource(basePath + imageFolder + "/" + it.filename); setImageSubmenuOpen(false); }
                )
              )}
            </div>
            <hr />
            <div>imported images</div>
            {renderImportedGrid(
              importedImages,
              (img) => imageSource === img.dataUrl,
              (img) => { setSourceType("image"); setImageSource(img.dataUrl); setImageSubmenuOpen(false); },
              (id) => setImportedImages((prev) => prev.filter((i) => i.id !== id))
            )}
          </div>
        )}

        {/* Video submenu */}
        {videoSubmenuOpen && (
          <div className="submenu-popup" onClick={(e) => { if (e.target === e.currentTarget) setVideoSubmenuOpen(false); }}>
            {renderSubmenuHeader("Video", [
              { label: "Import Video", onClick: handleUploadVideo },
            ])}
            <hr />
            <div className="submenu-popup-grid">
              {videoFiles && videoFiles.map((item) =>
                renderGalleryItem(
                  item,
                  isSelected(videoSource, item.filename),
                  (it) => { setSourceType("video"); setVideoSource(basePath + videoFolder + "/" + it.filename); setVideoSubmenuOpen(false); },
                  { showFilm: true }
                )
              )}
            </div>
            <hr />
            <div>imported videos</div>
            {renderImportedGrid(
              importedVideos,
              (v) => videoSource === v.url,
              (v) => { setSourceType("video"); setVideoSource(v.url); setVideoSubmenuOpen(false); },
              (id) => setImportedVideos((prev) => prev.filter((i) => i.id !== id)),
              { showFilm: true }
            )}
          </div>
        )}
      </div>

      <div className="mode-bar">
        <button onClick={(e) => { e.stopPropagation(); setEditMode(false); setCaptureMode(false); }} className={!editMode && !captureMode ? "mode-btn active" : "mode-btn"}>
          👁️ Viewer Mode
        </button>
        <button onClick={(e) => { e.stopPropagation(); setEditMode(true); setCaptureMode(false); }} className={editMode ? "mode-btn active" : "mode-btn"}>
          ✏️ Edit Texture
        </button>
      </div>
    </>
  );
}

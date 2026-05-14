import React, { useEffect, useRef, useState } from "react";

export default function Header({ showTexure, setShowTexure, sourceType, setSourceType, textureImage, setTextureImage, imageSource, setImageSource, videoSource, setVideoSource, textureFiles, textureFolder, imageFiles, imageFolder, videoFiles, videoFolder, thumbnailFolder, basePath: basePath_prop, editMode, setEditMode, savedImages, setSavedImages, importedTextures, setImportedTextures, importedImages, setImportedImages, importedVideos, setImportedVideos, captureMode, setCaptureMode, selectedObjFile, setSelectedObjFile, selectedObjScale, setSelectedObjScale, smoothShading, setSmoothShading }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditType, setCreditType] = useState('image');
  const [textureSubmenuOpen, setTextureSubmenuOpen] = useState(false);
  const [imageSubmenuOpen, setImageSubmenuOpen] = useState(false);
  const [videoSubmenuOpen, setVideoSubmenuOpen] = useState(false);
  const importTextureRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const counterRef = useRef(null);
  const headerRef = useRef(null);
  const basePath = basePath_prop || import.meta.env.BASE_URL;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMenuOpen(false);
        setCreditOpen(false);
        setTextureSubmenuOpen(false);
        setImageSubmenuOpen(false);
        setVideoSubmenuOpen(false);
      }
    };

    if (menuOpen || creditOpen || textureSubmenuOpen || imageSubmenuOpen || videoSubmenuOpen) {
      document.addEventListener("click", handleOutsideClick);
      return () => document.removeEventListener("click", handleOutsideClick);
    }
  }, [menuOpen, creditOpen, textureSubmenuOpen, imageSubmenuOpen, videoSubmenuOpen]);

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = basePath + 'face_mesh_2d.png';
    link.download = 'face_mesh_2d.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportTexture = (e) => {
    e.stopPropagation();
    importTextureRef.current?.click();
  };

  const handleUploadImage = (e) => {
    e.stopPropagation();
    imageInputRef.current?.click();
  };

  const handleUploadVideo = (e) => {
    e.stopPropagation();
    videoInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const newImported = [
          ...importedTextures,
          { id: Date.now(), dataUrl: dataUrl, name: file.name }
        ];
        setImportedTextures(newImported);
        setTextureImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const newImported = [
          ...importedImages,
          { id: Date.now(), dataUrl: dataUrl, name: file.name }
        ];
        setImportedImages(newImported);
        setSourceType("image");
        setImageSource(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const videoDataUrl = event.target.result;
        const video = document.createElement('video');
        video.src = videoDataUrl;

        video.addEventListener('loadedmetadata', () => {
          video.currentTime = video.duration * 0.1;
        });

        video.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL('image/png');

          const newImported = [
            ...importedVideos,
            { id: Date.now(), url: videoDataUrl, thumbnail: thumbnailUrl, name: file.name }
          ];
          setImportedVideos(newImported);
          setSourceType("video");
          setVideoSource(videoDataUrl);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const closeAllMenus = () => {
    setMenuOpen(false);
    setTextureSubmenuOpen(false);
    setImageSubmenuOpen(false);
    setVideoSubmenuOpen(false);
  };

  const closeSubmenus = () => {
    setTextureSubmenuOpen(false);
    setImageSubmenuOpen(false);
    setVideoSubmenuOpen(false);
  };

  const exitSpecialMode = () => {
    if (captureMode) setCaptureMode(false);
    if (editMode) setEditMode(false);
  };

  return (
    <div ref={headerRef} className="header" onClick={() => { if(menuOpen) closeAllMenus(); }}>

      <div className="menu-trigger" onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); setCreditOpen(false); }}>
        ☰ Menu
        {menuOpen && (
          <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>

            <div className="section-title">Texture</div>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                setTextureSubmenuOpen(!textureSubmenuOpen);
                setImageSubmenuOpen(false);
                setVideoSubmenuOpen(false);
              }}
              className={textureSubmenuOpen ? "source-btn active-open" : "source-btn"}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span>🎨 Texture</span>
                <span>&gt;</span>
              </span>
            </button>

            <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleImportTexture(e); closeSubmenus(); }}>
              📤 Upload texture
            </div>
            <div className="menu-item" onClick={(e) => { e.stopPropagation(); handleDownload(e); closeSubmenus(); }}>
              📥 Download blueprint
            </div>

            <div className="section-gap" />

            <div className="section-title">Upload</div>
            <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleUploadImage(e); closeSubmenus(); }}>
              🖼️ Upload Image
            </div>
            <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleUploadVideo(e); closeSubmenus(); }}>
              🎞️ Upload Video
            </div>

            <div className="section-gap" />

            <div className="section-title">Source</div>
            {["none", "image", "video", "camera"].map((type) => (
              <button
                key={type}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (type === "image") {
                    setTextureSubmenuOpen(false);
                    setVideoSubmenuOpen(false);
                    setImageSubmenuOpen(!imageSubmenuOpen);
                  } else if (type === "video") {
                    setTextureSubmenuOpen(false);
                    setImageSubmenuOpen(false);
                    setVideoSubmenuOpen(!videoSubmenuOpen);
                  } else {
                    setSourceType(type);
                    closeSubmenus();
                  }
                }}
                className={type === "image" ? (imageSubmenuOpen ? "source-btn active-open" : (sourceType === type ? "source-btn active-selected" : "source-btn")) : type === "video" ? (videoSubmenuOpen ? "source-btn active-open" : (sourceType === type ? "source-btn active-selected" : "source-btn")) : (sourceType === type ? "source-btn active-selected" : "source-btn")}
              >
                {type === "none" && "⊘ None"}
                {type === "image" && (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>🖼️ Image</span>
                    {imageSubmenuOpen && <span>&gt;</span>}
                  </span>
                )}
                {type === "video" && (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>🎞️ Video</span>
                    {videoSubmenuOpen && <span>&gt;</span>}
                  </span>
                )}
                {type === "camera" && "🎥 Camera"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="menu-item texture-toggle">
        <span>Show texture</span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowTexure(!showTexure); }}
          className={showTexure ? "toggle-btn on" : "toggle-btn off"}
        >
          {showTexure ? "ON" : "OFF"}
        </button>
      </div>

      <div className="menu-item texture-toggle">
        <span>Smooth Shading</span>
        <button
          onClick={(e) => { e.stopPropagation(); setSmoothShading(!smoothShading); }}
          className={smoothShading ? "toggle-btn on" : "toggle-btn off"}
        >
          {smoothShading ? "ON" : "OFF"}
        </button>
      </div>

      <div style={{ display: "none" }}>
        <input ref={importTextureRef} type="file" accept="image/*" onChange={handleFileChange} />
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} />
      </div>

      <div className="header-title" onClick={() => { setCreditOpen((prev) => !prev); setMenuOpen(false); }} style={{ cursor: "pointer" }}>
        MediaPipe FaceMesh Demo
      </div>

      <div style={{ display: "flex", gap: "10px", marginLeft: "auto", paddingRight: "20px", alignItems: "center" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); setCaptureMode(false); }}
          className="source-btn"
          style={{ fontSize: "13px" }}
        >
          ✏️ Edit texture
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCaptureMode(!captureMode); setEditMode(false); }}
          className="source-btn"
          style={{ fontSize: "13px" }}
        >
          📷 FaceCapture
        </button>
      </div>

      {creditOpen && (
        <div className="credit-dropdown">
          <div className="section-title">Credits</div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setCreditType('image'); }}
              className={creditType === 'image' ? "source-btn active-selected" : "source-btn"}
            >
              🖼️ Image
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCreditType('video'); }}
              className={creditType === 'video' ? "source-btn active-selected" : "source-btn"}
            >
              🎞️ Video
            </button>
          </div>

          {creditType === 'image' && (
            <>
              <div className="credit-label">🖼️ Sample Image Sources</div>
              {imageFiles && imageFiles.map((item, index) => (
                <div key={index} className="credit-item">
                  <div className="img_base">
                    <img src={item.thumbnail} alt={item.name} />
                  </div>
                  <div className="credit-text">{item.title}</div>
                  <div className="credit-text">{item.site}</div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="credit-link"
                  >
                    {item.url}
                  </a>
                </div>
              ))}
            </>
          )}

          {creditType === 'video' && (
            <>
              <div className="credit-label">🎞️ Sample Video Sources</div>
              {videoFiles && videoFiles.map((item, index) => (
                <div key={index} className="credit-item">
                  <div className="img_base">
                    <img src={item.thumbnail} alt={item.name} />
                    <img src={basePath + 'film.png'} alt="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                  </div>
                  <div className="credit-text">{item.title || item.name}</div>
                  <div className="credit-text">{item.site}</div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="credit-link"
                    >
                      {item.url}
                    </a>
                  )}
                </div>
              ))}
            </>
          )}

          <div className="credit-item">
            <div className="credit-label">🧑‍💻 Author</div>
            <div className="credit-text">mo256man</div>
            <a
              href="https://github.com/mo256man/mediapipe_facemesh_demo"
              target="_blank"
              rel="noopener noreferrer"
              className="credit-link"
            >
              https://github.com/mo256man/mediapipe_facemesh_demo
            </a>
          </div>

        </div>
      )}

      {textureSubmenuOpen && (
        <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setTextureSubmenuOpen(false); }}>
          <div style={{fontSize:"normal", fontWeight:"bold", marginBottom:"5px"}}>Texture</div>
          <div>prepared texture</div>
          <div className="submenu-popup-grid">
            {textureFiles && textureFiles.map((item) => (
              <div key={item.filename} onClick={(e) => { e.stopPropagation(); setTextureImage(basePath + textureFolder + "/" + item.filename); if (item.obj) setSelectedObjFile(item.obj); setSelectedObjScale(item.scale ?? 1.0); setTextureSubmenuOpen(false); }} style={{ cursor: "pointer" }}>
                <div className={textureImage && textureImage.includes ? (textureImage.includes(item.filename) ? "img_base selected" : "img_base") : "img_base"}>
                  <img src={item.thumbnail} alt={item.name} />
                </div>
                <span style={{ fontSize: "12px", display: "block", textAlign: "center", color: "#fff", marginTop: "4px" }}>{item.name}</span>
              </div>
            ))}
          </div>
          <hr />
          <div>saved textures</div>
          {savedImages && savedImages.length > 0 && (
            <div className="submenu-popup-grid" style={{ maxHeight: "200px", overflowY: "auto" }}>
              {savedImages.map((img) => (
                <div key={img.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setTextureImage(img.dataUrl); setTextureSubmenuOpen(false); }}>
                  <div style={{ position: "relative" }}>
                    <div className={textureImage === img.dataUrl ? "img_base selected" : "img_base"}>
                      <img src={img.dataUrl} alt="saved" />
                    </div>
                    <button
                      className="draw-gallery-delete"
                      onClick={(e) => { e.stopPropagation(); setSavedImages((prev) => prev.filter((i) => i.id !== img.id)); }}
                      style={{ position: "absolute", top: "2px", right: "2px", width: "20px", height: "20px", padding: "0", fontSize: "12px" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <hr />
          <div>imported textures</div>
          {importedTextures && importedTextures.length > 0 && (
            <div className="submenu-popup-grid" style={{ maxHeight: "200px", overflowY: "auto" }}>
              {importedTextures.map((img) => (
                <div key={img.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setTextureImage(img.dataUrl); setTextureSubmenuOpen(false); }}>
                  <div style={{ position: "relative" }}>
                    <div className={textureImage === img.dataUrl ? "img_base selected" : "img_base"}>
                      <img src={img.dataUrl} alt={img.name} />
                    </div>
                    <button
                      className="draw-gallery-delete"
                      onClick={(e) => { e.stopPropagation(); setImportedTextures((prev) => prev.filter((i) => i.id !== img.id)); }}
                      style={{ position: "absolute", top: "2px", right: "2px", width: "20px", height: "20px", padding: "0", fontSize: "12px" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {imageSubmenuOpen && (
        <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setImageSubmenuOpen(false); }}>
          <div>select sample image</div>
          <div className="submenu-popup-grid">
            {imageFiles && imageFiles.map((item) => (
              <div key={item.filename} style={{ cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={(e) => { e.stopPropagation(); setSourceType("image"); setImageSource(basePath + imageFolder + "/" + item.filename); setImageSubmenuOpen(false); }}>
                <div className={imageSource && imageSource.includes ? (imageSource.includes(item.filename) ? "img_base selected" : "img_base") : "img_base"} style={{ marginBottom: "4px" }}>
                  <img src={item.thumbnail} alt={item.name} />
                </div>
                <div style={{ fontSize: "11px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.site}</div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "10px", color: "#5ba3d0", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    Link
                  </a>
                </div>
              </div>
            ))}
          </div>
          <hr />
          <div>imported images</div>
          {importedImages && importedImages.length > 0 && (
            <div className="submenu-popup-grid" style={{ maxHeight: "200px", overflowY: "auto" }}>
              {importedImages.map((img) => (
                <div key={img.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setSourceType("image"); setImageSource(img.dataUrl); setImageSubmenuOpen(false); }}>
                  <div style={{ position: "relative" }}>
                    <div className={imageSource === img.dataUrl ? "img_base selected" : "img_base"}>
                      <img src={img.dataUrl} alt={img.name} />
                    </div>
                    <button
                      className="draw-gallery-delete"
                      onClick={(e) => { e.stopPropagation(); setImportedImages((prev) => prev.filter((i) => i.id !== img.id)); }}
                      style={{ position: "absolute", top: "2px", right: "2px", width: "20px", height: "20px", padding: "0", fontSize: "12px" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {videoSubmenuOpen && (
        <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setVideoSubmenuOpen(false); }}>
          <div>select sample video</div>
          <div className="submenu-popup-grid">
            {videoFiles && videoFiles.map((item) => (
              <div key={item.filename} style={{ cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={(e) => { e.stopPropagation(); setSourceType("video"); setVideoSource(basePath + videoFolder + "/" + item.filename); setVideoSubmenuOpen(false); }}>
                <div className={videoSource && videoSource.includes(item.filename) ? "img_base selected" : "img_base"} style={{ marginBottom: "4px", position: "relative" }}>
                  <img src={item.thumbnail} alt={item.name} />
                  <img src={basePath + 'film.png'} alt="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                </div>
                <div style={{ fontSize: "11px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.site}</div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "10px", color: "#5ba3d0", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      Link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <hr />
          <div>imported videos</div>
          {importedVideos && importedVideos.length > 0 && (
            <div className="submenu-popup-grid" style={{ maxHeight: "200px", overflowY: "auto" }}>
              {importedVideos.map((video) => (
                <div key={video.id} className="video-thumbnail" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setSourceType("video"); setVideoSource(video.url); setVideoSubmenuOpen(false); }}>
                  <div style={{ position: "relative" }}>
                    <div className={videoSource === video.url ? "img_base selected" : "img_base"}>
                      <img src={video.thumbnail} alt={video.name} />
                      <img src={basePath + 'film.png'} alt="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                    </div>
                    <button
                      className="draw-gallery-delete"
                      onClick={(e) => { e.stopPropagation(); setImportedVideos((prev) => prev.filter((i) => i.id !== video.id)); }}
                      style={{ position: "absolute", top: "2px", right: "2px", width: "20px", height: "20px", padding: "0", fontSize: "12px" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

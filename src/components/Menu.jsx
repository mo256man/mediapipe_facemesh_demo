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

  const closeSubmenus = () => {
    setTextureSubmenuOpen(false);
    setImageSubmenuOpen(false);
    setVideoSubmenuOpen(false);
  };

  return (
    <>
      <div ref={menuRef} style={{ position: "absolute", top: 10, left: 10, zIndex: 100 }}>
        <div className="menu-trigger" onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); }}>
          ☰ Menu
        </div>

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
            <div
              className="source-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
            >
              <span>Show texture</span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowTexure(!showTexure); }}
                className={showTexure ? "toggle-btn on" : "toggle-btn off"}
                style={{ width: "50px" }}
              >
                {showTexure ? "ON" : "OFF"}
              </button>
            </div>

            <div
              className="source-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
            >
              <span>Smooth Shading</span>
              <button
                onClick={(e) => { e.stopPropagation(); setSmoothShading(!smoothShading); }}
                className={smoothShading ? "toggle-btn on" : "toggle-btn off"}
                style={{ width: "50px" }}
              >
                {smoothShading ? "ON" : "OFF"}
              </button>
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
                className={type === "image" ? (imageSubmenuOpen ? "source-btn active-open" : "source-btn") : type === "video" ? (videoSubmenuOpen ? "source-btn active-open" : "source-btn") : "source-btn"}
              >
                {type === "none" && (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "16px", display: "inline-block", textAlign: "center" }}>
                      {sourceType === "none" ? "✔" : ""}
                    </span>
                    <span>⊘ None</span>
                  </span>
                )}
                {type === "image" && (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "16px", display: "inline-block", textAlign: "center" }}>
                        {sourceType === "image" ? "✔" : ""}
                      </span>
                      <span>🖼️ Image</span>
                    </span>
                    <span>&gt;</span>
                  </span>
                )}
                {type === "video" && (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "16px", display: "inline-block", textAlign: "center" }}>
                        {sourceType === "video" ? "✔" : ""}
                      </span>
                      <span>🎞️ Video</span>
                    </span>
                    <span>&gt;</span>
                  </span>
                )}
                {type === "camera" && "🎥 Camera"}
              </button>
            ))}

            <div className="section-gap" />

            <div className="credit-item" style={{ fontSize: "12px", padding: "8px 16px", marginTop: "8px" }}>
              <div className="credit-label" style={{ marginBottom: "4px" }}>🧑‍💻 Author</div>
              <div className="credit-text" style={{ fontSize: "11px", marginBottom: "4px" }}>mo256man</div>
              <a
                href="https://github.com/mo256man/mediapipe_facemesh_demo"
                target="_blank"
                rel="noopener noreferrer"
                className="credit-link"
                style={{ fontSize: "10px" }}
              >
                https://github.com/mo256man/mediapipe_facemesh_demo
              </a>
            </div>
          </div>
        )}

      <div style={{ display: "none" }}>
        <input ref={importTextureRef} type="file" accept="image/*" onChange={handleFileChange} />
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} />
      </div>

      {textureSubmenuOpen && (
        <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setTextureSubmenuOpen(false); }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "8px" }}>
            <div className="submenu-title">Texture</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={(e) => { e.stopPropagation(); handleImportTexture(e); }} className="submenu-header-button">Import Texture</button>
              <button onClick={(e) => { e.stopPropagation(); handleDownload(e); }} className="submenu-header-button">Download blueprint</button>
            </div>
          </div>
          <div>facemesh texture</div>
          <div className="submenu-popup-grid">
        {facemeshTextureFiles && facemeshTextureFiles.slice(1).map((item) => (
          <div
            key={item.filename}
            style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
            onClick={(e) => {
              e.stopPropagation();
              setTextureImage(basePath + textureFolder + "/" + item.filename);

              if (item.obj) {
                setSelectedObjFile(item.obj);
              }

              setSelectedObjScale(item.scale ?? 1.0);
              setTextureSubmenuOpen(false);
            }}
          >
    <div
      className={
        textureImage && textureImage.includes
          ? (textureImage.includes(item.filename)
              ? "img_base selected"
              : "img_base")
          : "img_base"
      }
      style={{ marginBottom: "4px" }}
    >
      <img src={item.thumbnail} alt={item.name} />
    </div>

    <div
      style={{
        fontSize: "11px",
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: "2px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {item.name}
      </div>

      <div
        style={{
          fontSize: "10px",
          color: "#aaa",
          marginBottom: "2px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {item.title}
      </div>

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "10px",
            color: "#5ba3d0",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "2px"
          }}
          onClick={(e) => { e.stopPropagation(); }}
        >
          {item.site}
        </a>
      )}
    </div>
  </div>
))}
          </div>
          <hr />
          <div>other model</div>
          <div className="submenu-popup-grid">
{otherModelFiles && otherModelFiles.map((item) => (
  <div
    key={item.filename}
    style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
    onClick={(e) => {
      e.stopPropagation();
      setTextureImage(basePath + textureFolder + "/" + item.filename);

      if (item.obj) {
        setSelectedObjFile(item.obj);
      }

      setSelectedObjScale(item.scale ?? 1.0);
      setTextureSubmenuOpen(false);
    }}
  >
    <div
      className={
        textureImage && textureImage.includes
          ? (textureImage.includes(item.filename)
              ? "img_base selected"
              : "img_base")
          : "img_base"
      }
      style={{ marginBottom: "4px" }}
    >
      <img src={item.thumbnail} alt={item.name} />
    </div>

    <div
      style={{
        fontSize: "11px",
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: "2px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {item.name}
      </div>

      <div
        style={{
          fontSize: "10px",
          color: "#aaa",
          marginBottom: "2px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {item.title}
      </div>

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "10px",
            color: "#5ba3d0",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "2px"
          }}
          onClick={(e) => { e.stopPropagation(); }}
        >
          {item.site}
        </a>
      )}
    </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "8px" }}>
            <div className="submenu-title">Image</div>
            <button onClick={(e) => { e.stopPropagation(); handleUploadImage(e); }} className="submenu-header-button">Import Image</button>
          </div>
          <hr />
          <div className="submenu-popup-grid">
            {imageFiles && imageFiles.map((item) => (
              <div key={item.filename} style={{ cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={(e) => { e.stopPropagation(); setSourceType("image"); setImageSource(basePath + imageFolder + "/" + item.filename); setImageSubmenuOpen(false); }}>
                <div className={imageSource && imageSource.includes ? (imageSource.includes(item.filename) ? "img_base selected" : "img_base") : "img_base"} style={{ marginBottom: "4px" }}>
                  <img src={item.thumbnail} alt={item.name} />
                </div>
                <div style={{ fontSize: "11px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "10px", color: "#5ba3d0", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    {item.site}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "8px" }}>
            <div className="submenu-title">Video</div>
            <button onClick={(e) => { e.stopPropagation(); handleUploadVideo(e); }} className="submenu-header-button">Import Video</button>
          </div>
          <hr />
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
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "10px", color: "#5ba3d0", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      {item.site}
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

    <div style={{ position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 101 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setEditMode(false); setCaptureMode(false); }}
        className={!editMode && !captureMode ? "mode-btn active" : "mode-btn"}
        style={{ padding: "8px 16px", fontSize: "14px", cursor: "pointer" }}
      >
        👁️ Viewer Mode
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setEditMode(true); setCaptureMode(false); }}
        className={editMode ? "mode-btn active" : "mode-btn"}
        style={{ padding: "8px 16px", fontSize: "14px", cursor: "pointer" }}
      >
        ✏️ Edit Texture
      </button>
      {/* <button
        onClick={(e) => { e.stopPropagation(); setCaptureMode(true); setEditMode(false); }}
        className={captureMode ? "mode-btn active" : "mode-btn"}
        style={{ padding: "8px 16px", fontSize: "14px", cursor: "pointer" }}
      >
        📷 Face Capture
      </button> */}
    </div>
    </>
  );
}

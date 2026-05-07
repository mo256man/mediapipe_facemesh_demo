import React, { useEffect, useRef, useState } from "react";

export default function Header({ showTexure, setShowTexure, sourceType, setSourceType, textureImage, setTextureImage, imageSource, setImageSource, videoSource, setVideoSource, textureFiles, textureFolder, imageFiles, imageFolder, videoFiles, videoFolder, thumbnailFolder, basePath: basePath_prop, editMode, setEditMode, savedImages, setSavedImages, importedTextures, setImportedTextures, importedImages, setImportedImages, importedVideos, setImportedVideos }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
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
      const url = URL.createObjectURL(file);
      const newImported = [
        ...importedTextures,
        { id: Date.now(), dataUrl: url, name: file.name }
      ];
      setImportedTextures(newImported);
      setTextureImage(url);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newImported = [
        ...importedImages,
        { id: Date.now(), dataUrl: url, name: file.name }
      ];
      setImportedImages(newImported);
      setSourceType("image");
      setImageSource(url);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = videoUrl;
      
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
          { id: Date.now(), url: videoUrl, thumbnail: thumbnailUrl, name: file.name }
        ];
        setImportedVideos(newImported);
        setSourceType("video");
        setVideoSource(videoUrl);
      });
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

  return (
    <div ref={headerRef} className="header" onClick={() => { if(menuOpen) closeAllMenus(); }}>

      <div className="menu-trigger" onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); }}>
        ☰ Menu
        {menuOpen && (
          <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>

            <div className="section-title">Texture</div>
            <div className="menu-item texture-toggle">
              <span>Show texture</span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowTexure(!showTexure); closeSubmenus(); }}
                className={showTexure ? "toggle-btn on" : "toggle-btn off"}
              >
                {showTexure ? "ON" : "OFF"}
              </button>
            </div>
            <div style={{ position: "relative" }}>
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
              {textureSubmenuOpen && (
                <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setTextureSubmenuOpen(false); }}>
                  <div>select texture</div>
                  <div className="submenu-popup-grid">
                    {textureFiles && textureFiles.map((item) => (
                      <div key={item.filename} onClick={(e) => { e.stopPropagation(); setTextureImage(basePath + textureFolder + "/" + item.filename); setTextureSubmenuOpen(false); }} style={{ cursor: "pointer" }}>
                        <div className={textureImage.includes(item.filename) ? "img_base selected" : "img_base"}>
                          <img src={basePath + textureFolder + "/" + item.filename} alt={item.name} />
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
            </div>
            <div className="menu-item" onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); closeAllMenus(); }}>
              ✏️ Edit texture
            </div>
            <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleImportTexture(e); closeSubmenus(); }}>
              📤 Upload texture
            </div>
            <div className="menu-item" onClick={(e) => { e.stopPropagation(); handleDownload(e); closeSubmenus(); }}>
              📥 Download blueprint
            </div>

            <div className="section-gap" />

            <div className="section-title">Source</div>
            {["none", "image", "video", "camera"].map((type) => (
              <div key={type} style={{ position: "relative" }}>
                <button
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
                      <span>&gt;</span>
                    </span>
                  )}
                  {type === "video" && (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span>🎞️ Video</span>
                      <span>&gt;</span>
                    </span>
                  )}
                  {type === "camera" && "🎥 Camera"}
                </button>
                {type === "image" && imageSubmenuOpen && (
                  <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setImageSubmenuOpen(false); }}>
                    <div>select sample image</div>
                    <div className="submenu-popup-grid">
                      {imageFiles && imageFiles.map((item) => (
                        <div key={item.filename} onClick={(e) => { e.stopPropagation(); setSourceType("image"); setImageSource(basePath + imageFolder + "/" + item.filename); setImageSubmenuOpen(false); }} style={{ cursor: "pointer" }}>
                          <div className={imageSource && imageSource.includes(item.filename) ? "img_base selected" : "img_base"}>
                            <img src={basePath + imageFolder + "/" + item.filename} alt={item.name} />
                          </div>
                          <span style={{ fontSize: "12px", display: "block", textAlign: "center", color: "#fff", marginTop: "4px" }}>{item.name}</span>
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
                {type === "image" && (
                  <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleUploadImage(e); closeSubmenus(); }}>
                    📤 Upload custom image
                  </div>
                )}
                {type === "video" && videoSubmenuOpen && (
                  <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setVideoSubmenuOpen(false); }}>
                    <div>select sample video</div>
                    <div className="submenu-popup-grid">
                      {videoFiles && videoFiles.map((item) => (
                        <div key={item.filename} onClick={(e) => { e.stopPropagation(); setSourceType("video"); setVideoSource(basePath + videoFolder + "/" + item.filename); setVideoSubmenuOpen(false); }} style={{ cursor: "pointer" }}>
                          <div className={videoSource && videoSource.includes(item.filename) ? "img_base selected" : "img_base"}>
                            <img src={basePath + thumbnailFolder + "/" + item.thumbnail} alt={item.name} />
                          </div>
                          <span style={{ fontSize: "12px", display: "block", textAlign: "center", color: "#fff", marginTop: "4px" }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <hr />
                    <div>imported videos</div>
                    {importedVideos && importedVideos.length > 0 && (
                      <div className="submenu-popup-grid" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {importedVideos.map((video) => (
                          <div key={video.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setSourceType("video"); setVideoSource(video.url); setVideoSubmenuOpen(false); }}>
                            <div style={{ position: "relative" }}>
                              <div className={videoSource === video.url ? "img_base selected" : "img_base"}>
                                <img src={video.thumbnail} alt={video.name} />
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
                {type === "video" && (
                  <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleUploadVideo(e); closeSubmenus(); }}>
                    📤 Upload custom video
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "none" }}>
        <input ref={importTextureRef} type="file" accept="image/*" onChange={handleFileChange} />
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} />
      </div>

      <div className="header-title">MediaPipe Face Mesh Demo</div>

      <div className="credit-trigger" onClick={() => setCreditOpen((prev) => !prev)}>
        ℹ️ Credits
        {creditOpen && (
          <div className="credit-dropdown">
            <div className="section-title">Credits</div>

            <div className="credit-item">
              <div className="credit-label">🖼️ Sample Image Source</div>
              <img src={basePath + "image_sample.jpg"} className="img_thumbnail" />
              <div className="credit-text">何かの動作の解説をするマッチョ</div>
              <div className="credit-text">マッスルプラス</div>
              <a
                href="https://freephotomuscle.com/archives/photo/8659"
                target="_blank"
                rel="noopener noreferrer"
                className="credit-link"
              >
                https://freephotomuscle.com/archives/photo/8659
              </a>
            </div>

            <div className="credit-item">
              <div className="credit-label">🎞️ Sample Video Source</div>
              <img src="movie_thumbnail.jpg" className="img_thumbnail" />
              <div className="credit-text">タオルで顔を拭く男性</div>
              <div className="credit-text">videoAC</div>
              <a
                href="https://video-ac.com/video/99195"
                target="_blank"
                rel="noopener noreferrer"
                className="credit-link"
              >
                https://video-ac.com/video/99195
              </a>
            </div>

            <div className="credit-item">
              <div className="credit-label">🧑‍💻 Author</div>
              <img src="author_thumbnail.png" className="author_thumbnail" />
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
      </div>
    </div>
  );
}
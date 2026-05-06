import React, { useEffect, useRef, useState } from "react";

export default function Header({ showTexure, setShowTexure, sourceType, setSourceType, textureImage, setTextureImage, imageSource, setImageSource, videoSource, setVideoSource, textureFiles, textureFolder, imageFiles, imageFolder, videoFiles, videoFolder, thumbnailFolder, basePath: basePath_prop, editMode, setEditMode }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [textureSubmenuOpen, setTextureSubmenuOpen] = useState(false);
  const [imageSubmenuOpen, setImageSubmenuOpen] = useState(false);
  const [videoSubmenuOpen, setVideoSubmenuOpen] = useState(false);
  const fileInputRef = useRef(null);
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

  const handleUploadMask = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
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
      setTextureImage(url);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSource(url);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSource(url);
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
                          <img src={basePath + textureFolder + "/" + item.filename} alt={item.text} />
                        </div>
                        <span style={{ fontSize: "12px", display: "block", textAlign: "center", color: "#fff", marginTop: "4px" }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <hr />
                  <div>edit texture</div>
                  <button onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); }}>edit</button>
                </div>
              )}
            </div>
            <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleUploadMask(e); closeSubmenus(); }}>
              📤 Upload custom mask
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
                    <div>select image</div>
                    <div className="submenu-popup-grid">
                      {imageFiles && imageFiles.map((item) => (
                        <div key={item.filename} onClick={(e) => { e.stopPropagation(); setSourceType("image"); setImageSource(basePath + imageFolder + "/" + item.filename); setImageSubmenuOpen(false); }} style={{ cursor: "pointer" }}>
                          <div className={imageSource && imageSource.includes(item.filename) ? "img_base selected" : "img_base"}>
                            <img src={basePath + imageFolder + "/" + item.filename} alt={item.text} />
                          </div>
                          <span style={{ fontSize: "12px", display: "block", textAlign: "center", color: "#fff", marginTop: "4px" }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {type === "image" && sourceType === "image" && imageSubmenuOpen === false && (
                  <div className="sub-options">
                    <div className="menu-item sample" onClick={(e) => { e.stopPropagation(); setImageSource(basePath + imageFolder + "/" + imageFiles[0]?.filename); closeSubmenus(); }}>
                      📁 Use sample image
                    </div>
                    <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleUploadImage(e); closeSubmenus(); }}>
                      📤 Upload custom image
                    </div>
                  </div>
                )}
                {type === "video" && videoSubmenuOpen && (
                  <div className="submenu-popup" onClick={(e) => { if(e.target === e.currentTarget) setVideoSubmenuOpen(false); }}>
                    <div>select video</div>
                    <div className="submenu-popup-grid">
                      {videoFiles && videoFiles.map((item) => (
                        <div key={item.filename} onClick={(e) => { e.stopPropagation(); setSourceType("video"); setVideoSource(basePath + videoFolder + "/" + item.filename); setVideoSubmenuOpen(false); }} style={{ cursor: "pointer" }}>
                          <div className={videoSource && videoSource.includes(item.filename) ? "img_base selected" : "img_base"}>
                            <img src={basePath + thumbnailFolder + "/" + item.thumbnail} alt={item.text} />
                          </div>
                          <span style={{ fontSize: "12px", display: "block", textAlign: "center", color: "#fff", marginTop: "4px" }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {type === "video" && sourceType === "video" && videoSubmenuOpen === false && (
                  <div className="sub-options">
                    <div className="menu-item sample" onClick={(e) => { e.stopPropagation(); setVideoSource(basePath + videoFolder + "/" + videoFiles[0]?.filename); closeSubmenus(); }}>
                      📁 Use sample video
                    </div>
                    <div className="menu-item upload" onClick={(e) => { e.stopPropagation(); handleUploadVideo(e); closeSubmenus(); }}>
                      📤 Upload custom video
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "none" }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
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
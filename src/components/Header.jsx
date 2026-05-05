import React, { useRef, useState } from "react";

export default function Header({ showTexure, setShowTexure, sourceType, setSourceType, textureImage, setTextureImage, imageSource, setImageSource, videoSource, setVideoSource }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const counterRef = useRef(null);

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = '/face_mesh_2d.png';
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

  return (
    <div className="header">

      <div className="menu-trigger" onClick={() => setMenuOpen((prev) => !prev)}>
        ☰ Menu
        {menuOpen && (
          <div className="menu-dropdown">

            <div className="section-title">Texture</div>
            <div className="menu-item texture-toggle">
              <span>Show texture</span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowTexure(!showTexure); }}
                className={showTexure ? "toggle-btn on" : "toggle-btn off"}
              >
                {showTexure ? "ON" : "OFF"}
              </button>
            </div>
            <div className="menu-item sample" onClick={(e) => { e.stopPropagation(); setTextureImage("/mask_sample.png"); }}>
              📁 Use sample mask
            </div>
            <div className="menu-item upload" onClick={handleUploadMask}>
              📤 Upload custom mask
            </div>
            <div className="menu-item" onClick={handleDownload}>
              📥 Download blueprint
            </div>

            <div className="section-gap" />

            <div className="section-title">Source</div>
            {["none", "image", "video", "camera"].map((type) => (
              <div key={type}>
                <button
                  onClick={(e) => { e.stopPropagation(); setSourceType(type); }}
                  className={sourceType === type ? "source-btn active" : "source-btn"}
                >
                  {type === "none" && "⊘ None"}
                  {type === "image" && "🖼️ Image"}
                  {type === "video" && "🎞️ Video"}
                  {type === "camera" && "🎥 Camera"}
                </button>
                {type === "image" && sourceType === "image" && (
                  <div className="sub-options">
                    <div className="menu-item sample" onClick={(e) => { e.stopPropagation(); setImageSource("/image_sample.jpg"); }}>
                      📁 Use sample image
                    </div>
                    <div className="menu-item upload" onClick={handleUploadImage}>
                      📤 Upload custom image
                    </div>
                  </div>
                )}
                {type === "video" && sourceType === "video" && (
                  <div className="sub-options">
                    <div className="menu-item sample" onClick={(e) => { e.stopPropagation(); setVideoSource("/movie_sample.mov"); }}>
                      📁 Use sample video
                    </div>
                    <div className="menu-item upload" onClick={handleUploadVideo}>
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
              <img src="image_sample.jpg" className="img_thumbnail" />
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
                href="https://github.com/mo256man"
                target="_blank"
                rel="noopener noreferrer"
                className="credit-link"
              >
                https://github.com/mo256man
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
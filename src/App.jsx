import { useState } from 'react';
import Header from './components/Header'
import FaceMeshViewer from './components/FaceMeshViewer'
import Draw from './components/Draw'
import samplesData from './components/samples.json'

function App() {
  const basePath = import.meta.env.BASE_URL;
  const imageFolder = "image";
  const videoFolder = "video";
  const thumbnailFolder = "thumbnail";
  const textureFolder = "texture";
  
  const textureFiles = samplesData.texture || [];
  const imageFiles = samplesData.iamge || [];
  const videoFiles = samplesData.video || [];
  
  const [showTexure, setShowTexure] = useState(true);
  const [sourceType, setSourceType] = useState("none");
  const [textureImage, setTextureImage] = useState(() => 
    textureFiles[0] ? basePath + textureFolder + "/" + textureFiles[0].filename : ""
  );
  const [imageSource, setImageSource] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      <Header showTexure={showTexure} setShowTexure={setShowTexure} sourceType={sourceType} setSourceType={setSourceType} textureImage={textureImage} setTextureImage={setTextureImage} imageSource={imageSource} setImageSource={setImageSource} videoSource={videoSource} setVideoSource={setVideoSource} textureFiles={textureFiles} textureFolder={textureFolder} imageFiles={imageFiles} imageFolder={imageFolder} videoFiles={videoFiles} videoFolder={videoFolder} thumbnailFolder={thumbnailFolder} basePath={basePath} editMode={editMode} setEditMode={setEditMode} />
      <div className="main" style={{ display: "flex", flexDirection: "row" }}>
        {!editMode && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} />
          </div>
        )}
        {editMode && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Draw />
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App

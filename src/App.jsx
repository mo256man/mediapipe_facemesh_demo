import { useState } from 'react';
import Header from './components/Header'
import Mp from './components/Mp'
import FaceMeshViewer from './components/FaceMeshViewer'

function App() {
  const basePath = import.meta.env.BASE_URL;
  const [showTexure, setShowTexure] = useState(true);
  const [sourceType, setSourceType] = useState("none");
  const [textureImage, setTextureImage] = useState(basePath + "mask_sample.png");
  const [imageSource, setImageSource] = useState(basePath + "image_sample.jpg");
  const [videoSource, setVideoSource] = useState(basePath + "movie_sample.mov");

  return (
    <>
      <Header showTexure={showTexure} setShowTexure={setShowTexure} sourceType={sourceType} setSourceType={setSourceType} textureImage={textureImage} setTextureImage={setTextureImage} imageSource={imageSource} setImageSource={setImageSource} videoSource={videoSource} setVideoSource={setVideoSource} />
      <div className="main">
        <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} />
      </div>
    </>
  )
}

export default App

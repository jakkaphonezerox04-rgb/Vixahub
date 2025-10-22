import React from 'react';

export const Component = () => {
  // Images for the infinite scroll - using Unsplash URLs
  const images = [
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png",
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png",
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png",
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png",
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png",
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png",
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png",
    "https://img5.pic.in.th/file/secure-sv1/logobae2d7ab0b1797ef.png"
  ];

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <>
      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 20s linear infinite;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
      
      <div className="w-full h-64 relative overflow-hidden flex items-center justify-center mb-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 z-10" />
        
        {/* Scrolling images container */}
        <div className="relative z-0 w-full flex items-center justify-center">
          <div className="scroll-container w-full">
            <div className="infinite-scroll flex gap-6 w-max">
              {duplicatedImages.map((image, index) => (
                <div
                  key={index}
                  className="image-item flex-shrink-0 w-48 h-48 rounded-xl overflow-hidden shadow-lg"
                >
                  <img
                    src={image}
                    alt={`Gallery image ${(index % images.length) + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 
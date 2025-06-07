import React from 'react'

const Footer = ({ remoteUser }) => {
  return (
    <footer className="bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-white py-8 mt-12 shadow-inner">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        {/* Left: Logo & Tagline */}
        <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
          <span className="font-extrabold text-xl tracking-wide text-indigo-300">codeSync</span>
          <span className="text-xs mt-1 text-gray-300 italic">Collaborate. Code. Connect.</span>
        </div>
        {/* Center: Copyright */}
        <div className="text-sm text-gray-400 mb-4 md:mb-0">
          © 2023 codeSync. All rights reserved.
        </div>
        {/* Right: Remote User & Social */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div>
            {remoteUser ? (
              <span className="text-sm text-green-400">Connected to: {remoteUser}</span>
            ) : (
              <span className="text-sm text-red-400">No remote user connected</span>
            )}
          </div>
          {/* Social Icons Example */}
          <div className="flex gap-3 mt-1">
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                {/* GitHub Icon */}
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.262.793-.582 0-.288-.012-1.242-.018-2.252-3.338.726-4.042-1.613-4.042-1.613-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.084-.73.084-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23A11.49 11.49 0 0112 6.844c1.022.005 2.051.138 3.014.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.625-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.292 0 .322.192.699.801.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                {/* Twitter Icon */}
                <path d="M24 4.557a9.93 9.93 0 01-2.828.775 4.932 4.932 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 00-8.38 4.482C7.691 8.094 4.066 6.13 1.64 3.161c-.542.929-.855 2.01-.855 3.17 0 2.188 1.115 4.118 2.823 5.247a4.904 4.904 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89A4.936 4.936 0 012 19.54a13.978 13.978 0 007.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.21-.005-.423-.014-.633A10.012 10.012 0 0024 4.557z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

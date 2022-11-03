import React, { useState } from 'react';
import TocSidebar from './TocSidebar';

export interface Heading {
  depth: number;
  text: string;
  slug: string;
}

interface TocTogglerProps {
  headings: Heading[];
}

export default function TocToggler(props: TocTogglerProps) {
  const [tocOpen, setTocOpen] = useState(false);

  const toggleToc = () => {
    setTocOpen(cur => !cur);
  };

  return (
    <div className="lg:hidden transition-all flex flex-col items-end gap-4 fixed right-[20px] bottom-[20px]">
      <div
        className={`${
          tocOpen ? 'block' : 'hidden'
        } max-w-[90vw] max-h-[calc(100vh-10rem)] overflow-y-auto ease-in-out bg-blue-400 dark:bg-blue-800 text-white py-4 px-2 drop-shadow-lg shadow-cyan-800 rounded-lg z-20
        `}
      >
        <TocSidebar
          headings={props.headings}
          tocItemTextClassName="text-xs text-white"
          tocItemClassName="hover:bg-sky-200 dark:hover:bg-slate-700 rounded-md pl-1"
        />
      </div>
      <div className="rounded-full w-12 h-12 mr-0 bg-blue-500 dark:bg-blue-800 z-20">
        <button
          className="ml-auto w-full h-full rounded-full"
          onClick={toggleToc}
        >
          <span className="material-symbols-outlined text-white pt-[4px]">
            toc
          </span>
        </button>
      </div>
      <div
        className={`${
          tocOpen ? 'block' : 'hidden'
        } fixed top-0 left-0 w-full h-full backdrop-blur-xl z-10 opacity-80 bg-blue/30`}
        onClick={toggleToc}
      ></div>
    </div>
  );
}

import React from 'react';

export function Container(
  props: React.PropsWithChildren & { className?: string }
) {
  return (
    <div
      className={`${
        props.className ? props.className : ''
      } max-w-screen-md lg:max-w-screen-xl h-full m-auto box-border px-2 bg-inherit`}
    >
      {props.children}
    </div>
  );
}

export function BlogPostContainer(props: React.PropsWithChildren) {
  return (
    <div className="max-w-screen-md lg:max-w-screen-md h-full m-auto box-border px-4 bg-inherit">
      {props.children}
    </div>
  );
}

export function ScreenContainer(
  props: React.PropsWithChildren & { className?: string }
) {
  return (
    <div className={`max-w-screen h-screen m-auto ${props.className}`}>
      {props.children}
    </div>
  );
}

export function ContentBox(
  props: React.PropsWithChildren & {
    imgSrc?: string;
    title?: string;
    icon?: string;
    description?: string;
    href?: string;
  }
) {
  return (
    <div className="rounded-lg box-border m-3 bg-blue-50 dark:bg-blue-800 drop-shadow-lg transition-colors duration-500 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300">
      <div>
        <a href={props.href}>
          <img
            src={props.imgSrc ? props.imgSrc : ''}
            className="object-cover w-full h-48 rounded-t-lg bg-white"
          />
        </a>
      </div>
      <div className="w-full p-2">
        <p className="font-bold text-md text-center">
          <a href={props.href}>
            <span className="material-icons mr-2 text-black dark:text-slate-50">
              {props.icon}
            </span>
          </a>
          <a href={props.href}>
            <span className="text-black dark:text-slate-50">{props.title}</span>
          </a>
        </p>
      </div>
      <div className="w-full text-sm p-2">
        <a href={props.href} className="w-full h-full">
          <span className="text-slate-800 dark:text-slate-50">
            {props.description}
          </span>
        </a>
      </div>
    </div>
  );
}

export function Chip(props: React.PropsWithChildren & { icon?: string }) {
  return (
    <div className="flex-inline w-fit px-2 rounded-full bg-blue-600 dark:bg-stone-700 text-white inline-block text-xs font-thin transition-colors duration-500">
      {props.icon ? (
        <span className="material-icons text-xs mr-1">{props.icon}</span>
      ) : (
        ''
      )}
      <span>{props.children}</span>
    </div>
  );
}

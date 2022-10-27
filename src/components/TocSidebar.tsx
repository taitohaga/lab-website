import React from 'react';

export interface Heading {
  depth: number;
  text: string;
  slug: string;
}

export interface HeadingNode {
  text: string;
  slug: string;
  depth: number;
  parent?: HeadingNode;
  children: HeadingNode[];
}

interface TocSidebarProps {
  headings: Heading[];
  className?: string;
  tocItemClassName?: string;
  tocItemTextClassName?: string;
}

export default function TocSidebar(props: TocSidebarProps) {
  const rootHeading: HeadingNode = {
    text: 'Table of Contents',
    slug: '',
    depth: 0,
    children: [],
  };

  let last = rootHeading;
  props.headings.forEach(h => {
    if (last.depth < h.depth) {
      let n = {
        text: h.text,
        slug: h.slug,
        depth: h.depth,
        parent: last,
        children: [],
      };
      last.children.push(n);
      last = n;
    } else if (last.depth === h.depth) {
      if (last.parent) {
        let n = {
          text: h.text,
          slug: h.slug,
          depth: h.depth,
          parent: last.parent,
          children: [],
        };
        last.parent.children.push(n);
        last = n;
      }
    } else {
      let par = last.parent;
      while (par) {
        if (par.depth === h.depth && par.parent) {
          let n = {
            text: h.text,
            slug: h.slug,
            depth: h.depth,
            parent: par.parent,
            children: [],
          };
          par.parent.children.push(n);
          last = n;
          break;
        }
        par = par.parent;
      }
    }
  });
  const tocItemClasses = props.tocItemClassName
    ? props.tocItemClassName
    : 'hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md pl-1';
  const tocItemTextClasses = props.tocItemTextClassName
    ? props.tocItemTextClassName
    : 'text-slate-800 dark:text-slate-50 text-xs';

  const renderToc = (headingNode: HeadingNode) => {
    return (
      <ul className="list-none">
        <li key={headingNode.slug}>
          <>
            <a href={`#${headingNode.slug}`}>
              <div className={tocItemClasses}>
                <span className={tocItemTextClasses}>{headingNode.text}</span>
              </div>
            </a>
            {headingNode.children.length !== 0 ? (
              headingNode.children.map((node: HeadingNode) => renderToc(node))
            ) : (
              <></>
            )}
          </>
        </li>
      </ul>
    );
  };

  //return renderToc(rootHeading);
  return (
    <ul className={`list-none ${props.className ? props.className : ''}`}>
      {rootHeading.children.map((node: HeadingNode) => {
        return (
          <li key={node.slug}>
            <>
              <a href={`#${node.slug}`}>
                <div className={tocItemClasses}>
                  <span className={tocItemTextClasses}>{node.text}</span>
                </div>
              </a>
              {node.children.length !== 0 ? (
                node.children.map((n: HeadingNode) => renderToc(n))
              ) : (
                <></>
              )}
            </>
          </li>
        );
      })}
    </ul>
  );
}

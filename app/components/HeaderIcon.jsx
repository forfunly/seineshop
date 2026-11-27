export function HeaderIcon({name}) {
  const paths = {
    camera: <><path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></>,
    heart: <path d="M20.8 4.9a5.3 5.3 0 0 0-7.5 0L12 6.2l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.6a5.3 5.3 0 0 0 0-7.5Z" />,
    globe: <><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.4 2.4 3.6 5.6 3.6 9.5s-1.2 7.1-3.6 9.5c-2.4-2.4-3.6-5.6-3.6-9.5s1.2-7.1 3.6-9.5Z"/></>,
    trolley: <><path d="M1.5 3.5h3l3.25 12h12L22 7H5.5"/><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  };
  return <svg className="header-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

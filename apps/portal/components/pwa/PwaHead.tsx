import RegisterServiceWorker from "./RegisterServiceWorker";

/**
 * Keeps the browser's install offer from the moment it arrives (it can come before the page's scripts are ready) and
 * registers the service worker. Used only on the field sales and CSR pages and on their install pages.
 * The script is a fixed string written here, with nothing from the request in it.
 */
const CAPTURE = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__lextaInstallPrompt=e;window.dispatchEvent(new Event("lexta-install-ready"));});`;

export default function PwaHead() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CAPTURE }} />
      <RegisterServiceWorker />
    </>
  );
}

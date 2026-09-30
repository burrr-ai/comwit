// Capture install eligibility before hydration. The event is used only after a click.
export const PWA_CAPTURE_SCRIPT = `(function(){
  if(window.__comwitPwa||window.parent!==window||!window.isSecureContext)return;
  var state=window.__comwitPwa={prompt:null,installed:false};
  window.addEventListener('beforeinstallprompt',function(event){event.preventDefault();state.prompt=event;});
  window.addEventListener('appinstalled',function(){state.prompt=null;state.installed=true;});
})();`

export function PwaInstallCapture() {
  return <script id="comwit-pwa-capture" dangerouslySetInnerHTML={{ __html: PWA_CAPTURE_SCRIPT }} />
}

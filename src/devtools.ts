import Toolbar from './components/toolbar';
import LiquidFlamegraph from './components/liquid-flamegraph';
import {getProfileData, setTotalTime, getBrowserTheme} from './utils';

import './styles/devtools.css';

const selectors = {
  refreshButton: '[data-refresh-button]',
  flamegraphContainer: '[data-flamegraph-container]',
  loadingAnimation: '[data-loading-animation]',
  initialMessage: '[data-initial-message]',
  notProfilableMessage: '[data-page-not-profilable]',
  flamegraphWrapper: '[data-flamegraph-wrapper]',
};

let liquidFlamegraph: LiquidFlamegraph;

chrome.devtools.inspectedWindow.eval(
  `typeof window.Shopify === 'object'`,
  function(isShopifyStore: boolean) {
    if (isShopifyStore) {
      chrome.devtools.panels.create('Shopify', '', './devtools.html');
      const toolbar = new Toolbar();

      if (getBrowserTheme() === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      toolbar.refreshButton.addEventListener('click', refreshPanel);
      toolbar.zoomOutButton.addEventListener('click', zoomOutFlamegraph);
    }
  },
);

async function refreshPanel() {
  document.querySelector(selectors.initialMessage)!.innerHTML = '';
  document
    .querySelector(selectors.flamegraphWrapper)!
    .classList.add('loading-fade');
  document.querySelector(selectors.loadingAnimation)!.classList.remove('hide');
  document.querySelector(selectors.notProfilableMessage)!.classList.add('hide');
  let profile: FormattedProfileData;

  try {
    try {
      profile = await getProfileData();
    } catch (error) {
      // If authorized request fails,log it, and make a request without auth just in case the profile_liquid beta flag is enabled.
      console.error(error);
      profile = await getProfileData(false);
    }

    liquidFlamegraph = new LiquidFlamegraph(
      document.querySelector(selectors.flamegraphContainer),
      profile,
    );

    // All events happening here are synchronous. The set timeout is for UI
    // purposes so that timing information gets displayed after the flamegraph is shown.
    setTimeout(function() {
      setTotalTime(profile.value);
    }, 300);

    document
      .querySelector(selectors.flamegraphWrapper)!
      .classList.remove('hide');
  } catch (error) {
    console.error(error);
    document.querySelector(selectors.flamegraphWrapper)!.classList.add('hide');
    document
      .querySelector(selectors.notProfilableMessage)!
      .classList.remove('hide');
  }

  document.querySelector(selectors.loadingAnimation)!.classList.add('hide');
  document
    .querySelector(selectors.flamegraphWrapper)!
    .classList.remove('loading-fade');
}

function zoomOutFlamegraph() {
  if (typeof liquidFlamegraph.flamegraph !== 'undefined') {
    liquidFlamegraph.flamegraph.resetZoom();
  }
}

/**
 * renders the document on load
 */
function render() {
  const ta = document.getElementById('copy-link');
  if (ta) {
    document.getElementById('link-button').removeChild(ta);
  }
  let html = document.getElementById('editor').value;
  html = scriptRender(html);
  html = processLines(html);
  html = processAlignment(html);
  console.log(html);
  html = processGreeks(html);
  const viewer = document.getElementById('viewer');
  viewer.innerHTML = html;
}

/**
 * processes the perceived alignment of each line
 * @param {string} html
 * @return {string}
 */
function processAlignment(html) {
  let indexAlign = html.indexOf('<p>  ');
  let indexEnd = html.indexOf('</p>', indexAlign);
  while (indexAlign > -1 && indexEnd > indexAlign) {
    const start = html.slice(0, indexAlign);
    const middle = '<p><span class="align-right">'
        + html.slice(indexAlign+3, indexEnd) + '</span><br/>';
    const end = html.slice(indexEnd);
    html = start + middle + end;
    indexAlign = html.indexOf('<p>  ');
    indexEnd = html.indexOf('</p>', indexAlign);
  }
  return html;
}

/**
 * puts each line in a separate paragraph
 * @param {string} html
 * @return {string}
 */
function processLines(html) {
  html = '<p>' + html;
  html = html.replace(/[\n]/g, '</p><p>');
  html += '</p>';
  return html;
}

/**
 * process greek letters
 * @param {string} html
 * @return {string}
 */
function processGreeks(html) {
  let sComm = html.indexOf('\\');
  let eComm = getCommandEnd(html, sComm);

  while (sComm != -1) {
    GREEKS.forEach(function(val) {
      const greekify = '&' + html.slice(sComm + 1, eComm) + ';';
      if (greekify == val) {
        html = html.slice(0, sComm) + greekify + html.slice(eComm);
      }
    });
    sComm = html.indexOf('\\', sComm + 1);
    eComm = getCommandEnd(html, sComm);
  }
  return html;
}

/**
 * returns the end of the next command string
 * @param {string} html
 * @param {int} sComm
 * @return {int}
 */
function getCommandEnd(html, sComm) {
  const space = html.indexOf(' ', sComm + 1);
  const slash = html.indexOf('\\', sComm + 1);
  const tag = html.indexOf('<', sComm + 1);
  const plus = html.indexOf('+', sComm+1);
  const sub = html.indexOf('-', sComm + 1);
  const mult = html.indexOf('*', sComm + 1);
  const div = html.indexOf('/', sComm + 1);
  const lbra = html.indexOf('(', sComm + 1);
  const lsq = html.indexOf('[', sComm + 1);
  const rbra = html.indexOf(')', sComm + 1);
  const rsq = html.indexOf(']', sComm + 1);
  const poss = [space, slash, tag, plus, sub, mult, div, lbra, lsq, rbra, rsq];
  let eComm = html.length;
  for (let i=0; i<poss.length; i++) {
    if (poss[i] == -1) {
      continue;
    } else if (poss[i] < eComm) {
      eComm = poss[i];
    }
  }

  return eComm;
}

/**
 * processes the url query string and renders it in the editor on load
 */
function processUrl() {
  if (window.location.search.length > 0) {
    const decoded = decodeURIComponent(window.location.search.slice(1));
    document.getElementById('editor').innerHTML = decoded;
    render();
  } else {
    render();
  }
}

/**
 * Renders superscripts and subscripts for characters
 * @param {string} html
 * @return {string}
 */
function scriptRender(html) {
  let indexSup = html.indexOf('^');
  let indexSub = html.indexOf('_');
  let newHtml = html;
  while (indexSup + indexSub != -2) {
    if (indexSup != -1 && (indexSup < indexSub || indexSub == -1)) {
      newHtml = replaceScripts(newHtml, indexSup, '^');
    } else if (indexSub != -1 && (indexSub < indexSup || indexSup == -1)) {
      newHtml = replaceScripts(newHtml, indexSub, '_');
    }
    indexSup = newHtml.indexOf('^');
    indexSub = newHtml.indexOf('_');
  }
  return newHtml;
}

/**
 * Replaces latex script characters with html
 * @param {string} newHtml
 * @param {int} index
 * @param {string} char
 * @return {string}
 */
function replaceScripts(newHtml, index, char) {
  const charBool = char == '_';
  const stag = charBool ? '<sub>' : '<sup>';
  const etag = charBool ? '</sub>' : '</sup>';
  const opp = charBool ? '^' : '_';
  const pre = newHtml.slice(0, index);
  let middle = '';
  let post = '';
  if (!checkDouble(newHtml, opp, index)) {
    const res = scriptContents(newHtml, index);
    if (res[1]) {
      middle = stag + res[0] + etag;
      post = newHtml.slice(res[1]);
    } else {
      middle = stag + etag;
      post = res[0];
    }
  } else {
    const spanStag = '<span class = \'supsub\'>';
    const spanEtag = '</span>';
    let stag;
    let oppStag;
    let oppEtag;
    if (charBool) {
      stag = '<sub class=\'subscript\'>';
      oppStag = '<sup class=\'superscript\'>';
      oppEtag = '</sup>';
    } else {
      stag = '<sup class=\'superscript\'>';
      oppStag = '<sub class=\'subscript\'>';
      oppEtag = '</sub>';
    }
    const res = scriptContents(newHtml, index);
    if (res[1]) {
      middle = spanStag;
      const str = stag + res[0] + etag;
      let oppStr;
      const oppRes = scriptContents(newHtml, res[1]);
      if (oppRes[1]) {
        oppStr = oppStag + oppRes[0] + oppEtag;
        post = newHtml.slice(oppRes[1]);
      } else {
        oppStr = oppStag + oppEtag;
        post = oppRes[0];
      }

      if (opp == '_') {
        middle += str + oppStr + spanEtag;
      } else {
        middle += oppStr + str + spanEtag;
      }
    } else {
      middle = spanStag + stag + etag + oppStag + oppEtag + spanEtag;
      post = res[0];
    }
  }
  newHtml = pre + middle + post;
  return newHtml;
}

/**
 * checks if a character has a superscript and a subscript
 * @param {string} html
 * @param {string} opp
 * @param {int} sInd
 * @return {bool}
 */
function checkDouble(html, opp, sInd) {
  if (html.slice(sInd+1, sInd+2) != '{') {
    const chk = html.slice(sInd + 2, sInd + 3);
    return chk == opp;
  } else {
    const end = html.indexOf('}', sInd);
    if (end == -1) {
      return false;
    }
    const chk = html.slice(end + 1, end + 2);
    return chk == opp;
  }
}

/**
 * gets the content associated with each script character
 * @param {string} html
 * @param {int} index
 * @return {[string, int]}
 */
function scriptContents(html, index) {
  const nextChar = html.slice(index + 1, index + 2);
  let indexEnd = index+2;
  let ret;
  if (nextChar != '{') {
    ret = nextChar;
  } else {
    const endChar = html.indexOf('}', indexEnd);
    if (endChar <= index + 1) {
      return [html.slice(index+2)];
    }
    ret = html.slice(index+2, endChar);
    indexEnd = endChar+1;
  }
  return [ret, indexEnd];
}

/**
 * gets the tinified url from the server
 */
function getTiny() {
  const text = document.getElementById('editor').value;
  const href = window.location.href;
  const currQuery = href.indexOf('?');
  const longUrl = href.slice(0, currQuery) + '?' + encodeURIComponent(text);
  const socket = io();
  socket.emit('request', {
    url: longUrl,
  });
  socket.on('response', function(data) {
    const tinyUrl = data.tinyUrl;
    displayUrl(tinyUrl);
  });
  socket.on('error', function(data) {
    alert('An error occurred: ' + data.err);
  });
}

/**
 * places the tinified url in a text area
 * @param {string} url
 */
function displayUrl(url) {
  const textArea = document.createElement('textarea');
  textArea.id = 'copy-link';
  textArea.value = url;
  document.getElementById('link-button').appendChild(textArea);
  textArea.focus();
  textArea.select();
}

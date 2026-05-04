__d(function(g,r,i,a,m,_e,d){"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.SmagEditProfileNative=function(){const e=(0,l.useRouter)(),[f,p]=(0,o.useState)(j.DEFAULT_USER_PROFILE.fullName),[v,L]=(0,o.useState)(j.DEFAULT_USER_PROFILE.email),[P,_]=(0,o.useState)(j.DEFAULT_USER_PROFILE.phone),[F,C]=(0,o.useState)(j.DEFAULT_USER_PROFILE.birthday),[I,D]=(0,o.useState)(j.DEFAULT_USER_PROFILE.address),[w,W]=(0,o.useState)(j.DEFAULT_USER_PROFILE.avatarUri);async function A(){const e=await(0,j.pickProfileImageFromDevice)();e?W(e):n.default.alert("Upload unavailable","Photo upload is currently available on web preview.")}(0,o.useEffect)(()=>{let e=!0;return(0,j.getUserProfile)().then(t=>{e&&(p(t.fullName),L(t.email),_(t.phone),C(t.birthday),D(t.address),W(t.avatarUri))}),()=>{e=!1}},[]);const[z,O]=(0,o.useState)(null),[M,k]=(0,o.useState)(null),[B,N]=(0,o.useState)(null);async function Y(){const t=(0,T.validateFullName)(f),l=(0,T.validateEmail)(v),o=(0,T.validatePhone)(P);if(O(t),k(l),N(o),t||l||o)return;let s=w;const u=(0,E.getCurrentUser)();if(Boolean(u?.uid)&&(w.startsWith("file:")||w.startsWith("content:")||w.startsWith("data:"))&&u)try{s=await(0,S.uploadProfileImageToFirebase)({uid:u.uid,imageUri:w})}catch{n.default.alert("Photo upload warning","We could not upload your new photo to cloud storage. Your profile will still be updated locally.")}await(0,j.updateUserProfile)({fullName:f.trim()||j.DEFAULT_USER_PROFILE.fullName,email:v.trim()||j.DEFAULT_USER_PROFILE.email,phone:P.trim()||j.DEFAULT_USER_PROFILE.phone,birthday:F.trim(),address:I.trim()||j.DEFAULT_USER_PROFILE.address,avatarUri:s}),e.replace("/smag_profile")}return(0,y.jsx)(b.SafeAreaView,{style:U.safe,children:(0,y.jsxs)(c.default,{contentContainerStyle:U.content,children:[(0,y.jsxs)(x.default,{style:U.header,children:[(0,y.jsxs)(x.default,{style:U.headerLeft,children:[(0,y.jsx)(u.default,{onPress:()=>e.back(),children:(0,y.jsx)(t.MaterialIcons,{name:"arrow-back",size:22,color:"#ff5c00"})}),(0,y.jsx)(h.default,{style:U.headerTitle,children:"Profile Settings"})]}),(0,y.jsx)(u.default,{onPress:Y,children:(0,y.jsx)(h.default,{style:U.saveTop,children:"Save"})})]}),(0,y.jsxs)(x.default,{style:U.photoWrap,children:[(0,y.jsx)(s.default,{source:{uri:w},style:U.photo}),(0,y.jsx)(u.default,{style:U.cameraFab,onPress:A,children:(0,y.jsx)(t.MaterialIcons,{name:"photo-camera",size:18,color:"#431200"})})]}),(0,y.jsx)(h.default,{style:U.nameLabel,children:f||"Your Name"}),(0,y.jsxs)(u.default,{style:U.uploadBtn,onPress:A,children:[(0,y.jsx)(t.MaterialIcons,{name:"upload",size:15,color:"#a33800"}),(0,y.jsx)(h.default,{style:U.uploadText,children:"Upload Profile Picture"})]}),(0,y.jsxs)(x.default,{style:U.formCard,children:[(0,y.jsx)(R,{label:"FULL NAME",value:f,onChangeText:e=>{p(e),O(null)},icon:"person",error:z}),(0,y.jsx)(R,{label:"EMAIL ADDRESS",value:v,onChangeText:e=>{L(e),k(null)},icon:"alternate-email",error:M}),(0,y.jsx)(R,{label:"PHONE NUMBER",value:P,onChangeText:e=>{_(e),N(null)},icon:"call",error:B}),(0,y.jsx)(R,{label:"DELIVERY ADDRESS",value:I,onChangeText:D,icon:"home"}),(0,y.jsx)(R,{label:"BIRTHDAY",value:F,onChangeText:C,icon:"cake",placeholder:"MM/DD/YYYY"})]}),(0,y.jsx)(u.default,{style:U.saveBtn,onPress:Y,children:(0,y.jsx)(h.default,{style:U.saveText,children:"Save Changes"})})]})})};var t=r(d[0]),l=r(d[1]),o=r(d[2]),n=e(r(d[3])),s=e(r(d[4])),u=e(r(d[5])),c=e(r(d[6])),f=e(r(d[7])),h=e(r(d[8])),p=e(r(d[9])),x=e(r(d[10])),b=r(d[11]),E=r(d[12]),S=r(d[13]),j=r(d[14]),T=r(d[15]),y=r(d[16]);function R(e){return(0,y.jsxs)(x.default,{style:U.fieldWrap,children:[(0,y.jsx)(h.default,{style:U.label,children:e.label}),(0,y.jsxs)(x.default,{style:[U.inputWrap,e.error?U.inputWrapError:null],children:[(0,y.jsx)(p.default,{style:U.input,value:e.value,onChangeText:e.onChangeText,placeholder:e.placeholder??"",placeholderTextColor:"#80503288",autoCapitalize:"none",autoCorrect:!1}),(0,y.jsx)(t.MaterialIcons,{name:e.icon,size:18,color:"#80503288"})]}),e.error?(0,y.jsx)(h.default,{style:U.errorText,children:e.error}):null]})}const U=f.default.create({safe:{flex:1,backgroundColor:"#fff4f0"},content:{padding:20,paddingBottom:36},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},headerLeft:{flexDirection:"row",alignItems:"center",gap:8},headerTitle:{color:"#4b240a",fontSize:20,fontWeight:"900"},saveTop:{color:"#ff5c00",fontSize:16,fontWeight:"800"},photoWrap:{alignSelf:"center",marginTop:18,width:150,height:150,borderRadius:26,overflow:"hidden"},photo:{width:"100%",height:"100%"},cameraFab:{position:"absolute",right:8,bottom:8,width:34,height:34,borderRadius:17,backgroundColor:"#ff7941",alignItems:"center",justifyContent:"center"},nameLabel:{alignSelf:"center",marginTop:10,marginBottom:10,color:"#805032",fontWeight:"600"},uploadBtn:{alignSelf:"center",borderRadius:999,backgroundColor:"#ffede5",paddingVertical:10,paddingHorizontal:14,marginBottom:12,flexDirection:"row",alignItems:"center",gap:6},uploadText:{color:"#a33800",fontWeight:"800",fontSize:12},formCard:{borderRadius:20,backgroundColor:"#ffede5",padding:14,gap:12},fieldWrap:{gap:5},label:{color:"#805032",fontSize:11,letterSpacing:1.1,fontWeight:"800"},inputWrap:{borderRadius:14,backgroundColor:"#ffffff",minHeight:50,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:8},input:{flex:1,color:"#4b240a",fontSize:15},inputWrapError:{borderWidth:1.5,borderColor:"#b31b25"},errorText:{color:"#b31b25",fontSize:12,marginTop:3,marginLeft:4},saveBtn:{marginTop:14,borderRadius:999,minHeight:54,backgroundColor:"#a33800",alignItems:"center",justifyContent:"center"},saveText:{color:"#ffefeb",fontSize:17,fontWeight:"900"}})},776,[649,20,38,456,311,352,266,154,141,377,258,364,752,813,816,817,15]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.uploadProfileImageToFirebase=async function(t){const o=u(t.imageUri),c=await fetch(t.imageUri);if(!c.ok)throw new Error("Unable to read selected image file.");const f=await c.blob(),l=(0,n.ref)(s,`users/${t.uid}/profile/avatar_${Date.now()}.${o}`);return await(0,n.uploadBytes)(l,f,{contentType:p(o)}),(0,n.getDownloadURL)(l)};var t=r(d[0]),n=r(d[1]),o=r(d[2]);const c=(0,t.getApps)().length?(0,t.getApp)():(0,t.initializeApp)(o.firebaseConfig),s=(0,n.getStorage)(c);function u(t){const n=/\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(t);return(n?.[1]??"jpg").toLowerCase()}function p(t){switch(t){case"png":return"image/png";case"webp":return"image/webp";case"heic":return"image/heic";default:return"image/jpeg"}}},813,[753,814,765]);
__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0});var t=r(d[0]);Object.keys(t).forEach(function(n){'default'===n||Object.prototype.hasOwnProperty.call(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[n]}})})},814,[815]);
__d(function(g,r,_i,a,m,_e,d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"StorageError",{enumerable:!0,get:function(){return o}}),Object.defineProperty(_e,"StorageErrorCode",{enumerable:!0,get:function(){return i}}),Object.defineProperty(_e,"StringFormat",{enumerable:!0,get:function(){return V}}),Object.defineProperty(_e,"_FbsBlob",{enumerable:!0,get:function(){return ee}}),Object.defineProperty(_e,"_Location",{enumerable:!0,get:function(){return k}}),Object.defineProperty(_e,"_TaskEvent",{enumerable:!0,get:function(){return He}}),Object.defineProperty(_e,"_TaskState",{enumerable:!0,get:function(){return ze}}),Object.defineProperty(_e,"_UploadTask",{enumerable:!0,get:function(){return et}}),Object.defineProperty(_e,"_dataFromString",{enumerable:!0,get:function(){return $}}),Object.defineProperty(_e,"_getChild",{enumerable:!0,get:function(){return Nt}}),Object.defineProperty(_e,"_invalidArgument",{enumerable:!0,get:function(){return b}}),Object.defineProperty(_e,"_invalidRootOperation",{enumerable:!0,get:function(){return R}}),Object.defineProperty(_e,"connectStorageEmulator",{enumerable:!0,get:function(){return Lt}}),Object.defineProperty(_e,"deleteObject",{enumerable:!0,get:function(){return St}}),Object.defineProperty(_e,"getBlob",{enumerable:!0,get:function(){return Mt}}),Object.defineProperty(_e,"getBytes",{enumerable:!0,get:function(){return kt}}),Object.defineProperty(_e,"getDownloadURL",{enumerable:!0,get:function(){return It}}),Object.defineProperty(_e,"getMetadata",{enumerable:!0,get:function(){return Ut}}),Object.defineProperty(_e,"getStorage",{enumerable:!0,get:function(){return Dt}}),Object.defineProperty(_e,"getStream",{enumerable:!0,get:function(){return Bt}}),Object.defineProperty(_e,"list",{enumerable:!0,get:function(){return At}}),Object.defineProperty(_e,"listAll",{enumerable:!0,get:function(){return Pt}}),Object.defineProperty(_e,"ref",{enumerable:!0,get:function(){return xt}}),Object.defineProperty(_e,"updateMetadata",{enumerable:!0,get:function(){return Ct}}),Object.defineProperty(_e,"uploadBytes",{enumerable:!0,get:function(){return Et}}),Object.defineProperty(_e,"uploadBytesResumable",{enumerable:!0,get:function(){return Ot}}),Object.defineProperty(_e,"uploadString",{enumerable:!0,get:function(){return vt}});var e=r(d[0]),t=r(d[1]),n=r(d[2]);
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
const s='firebasestorage.googleapis.com';
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
class o extends t.FirebaseError{constructor(e,t,n=0){super(c(e),`Firebase Storage: ${t} (${c(e)})`),this.status_=n,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,o.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return c(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}\n${this.customData.serverResponse}`:this.message=this._baseMessage}}var i,u;function c(e){return'storage/'+e}function l(){return new o(i.UNKNOWN,"An unknown error occurred, please check the error payload for server response.")}function h(){return new o(i.RETRY_LIMIT_EXCEEDED,'Max retry time for operation exceeded, please try again.')}function _(){return new o(i.CANCELED,'User canceled the upload/download.')}function p(e){return new o(i.INVALID_URL,"Invalid URL '"+e+"'.")}function f(){return new o(i.CANNOT_SLICE_BLOB,'Cannot slice blob for upload. Please retry the upload.')}function b(e){return new o(i.INVALID_ARGUMENT,e)}function T(){return new o(i.APP_DELETED,'The Firebase app was deleted.')}function R(e){return new o(i.INVALID_ROOT_OPERATION,"The operation '"+e+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function w(e,t){return new o(i.INVALID_FORMAT,"String does not match format '"+e+"': "+t)}function y(e){throw new o(i.INTERNAL_ERROR,'Internal error: '+e)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */!(function(e){e.UNKNOWN="unknown",e.OBJECT_NOT_FOUND="object-not-found",e.BUCKET_NOT_FOUND="bucket-not-found",e.PROJECT_NOT_FOUND="project-not-found",e.QUOTA_EXCEEDED="quota-exceeded",e.UNAUTHENTICATED="unauthenticated",e.UNAUTHORIZED="unauthorized",e.UNAUTHORIZED_APP="unauthorized-app",e.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",e.INVALID_CHECKSUM="invalid-checksum",e.CANCELED="canceled",e.INVALID_EVENT_NAME="invalid-event-name",e.INVALID_URL="invalid-url",e.INVALID_DEFAULT_BUCKET="invalid-default-bucket",e.NO_DEFAULT_BUCKET="no-default-bucket",e.CANNOT_SLICE_BLOB="cannot-slice-blob",e.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",e.NO_DOWNLOAD_URL="no-download-url",e.INVALID_ARGUMENT="invalid-argument",e.INVALID_ARGUMENT_COUNT="invalid-argument-count",e.APP_DELETED="app-deleted",e.INVALID_ROOT_OPERATION="invalid-root-operation",e.INVALID_FORMAT="invalid-format",e.INTERNAL_ERROR="internal-error",e.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(i||(i={}));class k{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return 0===this.path.length}fullServerUrl(){const e=encodeURIComponent;return'/b/'+e(this.bucket)+'/o/'+e(this.path)}bucketOnlyServerUrl(){return'/b/'+encodeURIComponent(this.bucket)+'/o'}static makeFromBucketSpec(e,t){let n;try{n=k.makeFromUrl(e,t)}catch(t){return new k(e,'')}if(''===n.path)return n;throw s=e,new o(i.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+s+"'.");var s}static makeFromUrl(e,t){let n=null;const o='([A-Za-z0-9.\\-_]+)';const i=new RegExp("^gs://([A-Za-z0-9.\\-_]+)(/(.*))?$",'i');function u(e){e.path_=decodeURIComponent(e.path)}const c=t.replace(/[.]/g,'\\.'),l=[{regex:i,indices:{bucket:1,path:3},postModify:function(e){'/'===e.path.charAt(e.path.length-1)&&(e.path_=e.path_.slice(0,-1))}},{regex:new RegExp(`^https?://${c}/v[A-Za-z0-9_]+/b/${o}/o(/([^?#]*).*)?$`,'i'),indices:{bucket:1,path:3},postModify:u},{regex:new RegExp(`^https?://${t===s?'(?:storage.googleapis.com|storage.cloud.google.com)':t}/${o}/([^?#]*)`,'i'),indices:{bucket:1,path:2},postModify:u}];for(let t=0;t<l.length;t++){const s=l[t],o=s.regex.exec(e);if(o){const e=o[s.indices.bucket];let t=o[s.indices.path];t||(t=''),n=new k(e,t),s.postModify(n);break}}if(null==n)throw p(e);return n}}class E{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function v(e,t,n){let s=1,o=null,i=null,u=!1,c=0;function l(){return 2===c}let h=!1;function _(...e){h||(h=!0,t.apply(null,e))}function p(t){o=setTimeout(()=>{o=null,e(b,l())},t)}function f(){i&&clearTimeout(i)}function b(e,...t){if(h)return void f();if(e)return f(),void _.call(null,e,...t);if(l()||u)return f(),void _.call(null,e,...t);let n;s<64&&(s*=2),1===c?(c=2,n=0):n=1e3*(s+Math.random()),p(n)}let T=!1;function R(e){T||(T=!0,f(),h||(null!==o?(e||(c=2),clearTimeout(o),p(0)):e||(c=1)))}return p(0),i=setTimeout(()=>{u=!0,R(!0)},n),R}function O(e){return'string'==typeof e||e instanceof String}function U(e){return C()&&e instanceof Blob}function C(){return'undefined'!=typeof Blob}function A(e,t,n,s){if(s<t)throw b(`Invalid value for '${e}'. Expected ${t} or greater.`);if(s>n)throw b(`Invalid value for '${e}'. Expected ${n} or less.`)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function P(e,t,n){let s=t;return null==n&&(s=`https://${t}`),`${n}://${s}/v0${e}`}function I(e){const t=encodeURIComponent;let n='?';for(const s in e)if(e.hasOwnProperty(s)){n=n+(t(s)+'='+t(e[s]))+'&'}return n=n.slice(0,-1),n}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function S(e,t){const n=e>=500&&e<600,s=-1!==[408,429].indexOf(e),o=-1!==t.indexOf(e);return n||s||o}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */!(function(e){e[e.NO_ERROR=0]="NO_ERROR",e[e.NETWORK_ERROR=1]="NETWORK_ERROR",e[e.ABORT=2]="ABORT"})(u||(u={}));class x{constructor(e,t,n,s,o,i,u,c,l,h,_,p=!0,f=!1){this.url_=e,this.method_=t,this.headers_=n,this.body_=s,this.successCodes_=o,this.additionalRetryCodes_=i,this.callback_=u,this.errorCallback_=c,this.timeout_=l,this.progressCallback_=h,this.connectionFactory_=_,this.retry=p,this.isUsingEmulator=f,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((e,t)=>{this.resolve_=e,this.reject_=t,this.start_()})}start_(){const e=(e,t)=>{if(t)return void e(!1,new N(!1,null,!0));const n=this.connectionFactory_();this.pendingConnection_=n;const s=e=>{const t=e.loaded,n=e.lengthComputable?e.total:-1;null!==this.progressCallback_&&this.progressCallback_(t,n)};null!==this.progressCallback_&&n.addUploadProgressListener(s),n.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{null!==this.progressCallback_&&n.removeUploadProgressListener(s),this.pendingConnection_=null;const t=n.getErrorCode()===u.NO_ERROR,o=n.getStatus();if(!t||S(o,this.additionalRetryCodes_)&&this.retry){const t=n.getErrorCode()===u.ABORT;return void e(!1,new N(!1,null,t))}const i=-1!==this.successCodes_.indexOf(o);e(!0,new N(i,n))})},t=(e,t)=>{const n=this.resolve_,s=this.reject_,o=t.connection;if(t.wasSuccessCode)try{const e=this.callback_(o,o.getResponse());void 0!==e?n(e):n()}catch(e){s(e)}else if(null!==o){const e=l();e.serverResponse=o.getErrorText(),this.errorCallback_?s(this.errorCallback_(o,e)):s(e)}else if(t.canceled){s(this.appDelete_?T():_())}else{s(h())}};this.canceled_?t(0,new N(!1,null,!0)):this.backoffId_=v(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,null!==this.backoffId_&&(0,this.backoffId_)(!1),null!==this.pendingConnection_&&this.pendingConnection_.abort()}}class N{constructor(e,t,n){this.wasSuccessCode=e,this.connection=t,this.canceled=!!n}}function D(e,t){null!==t&&t.length>0&&(e.Authorization='Firebase '+t)}function L(e,t){e['X-Firebase-Storage-Version']='webjs/'+(null!=t?t:'AppManager')}function M(e,t){t&&(e['X-Firebase-GMPID']=t)}function B(e,t){null!==t&&(e['X-Firebase-AppCheck']=t)}function j(e,t,n,s,o,i,u=!0,c=!1){const l=I(e.urlParams),h=e.url+l,_=Object.assign({},e.headers);return M(_,t),D(_,n),L(_,i),B(_,s),new x(h,e.method,_,e.body,e.successCodes,e.additionalRetryCodes,e.handler,e.errorHandler,e.timeout,e.progressCallback,o,u,c)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function q(){return'undefined'!=typeof BlobBuilder?BlobBuilder:'undefined'!=typeof WebKitBlobBuilder?WebKitBlobBuilder:void 0}function F(...e){const t=q();if(void 0!==t){const n=new t;for(let t=0;t<e.length;t++)n.append(e[t]);return n.getBlob()}if(C())return new Blob(e);throw new o(i.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}function H(e,t,n){return e.webkitSlice?e.webkitSlice(t,n):e.mozSlice?e.mozSlice(t,n):e.slice?e.slice(t,n):null}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function z(e){if('undefined'==typeof atob)throw t='base-64',new o(i.UNSUPPORTED_ENVIRONMENT,`${t} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`);var t;return atob(e)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const V={RAW:'raw',BASE64:'base64',BASE64URL:'base64url',DATA_URL:'data_url'};class W{constructor(e,t){this.data=e,this.contentType=t||null}}function $(e,t){switch(e){case V.RAW:return new W(G(t));case V.BASE64:case V.BASE64URL:return new W(K(e,t));case V.DATA_URL:return new W(J(t),Y(t))}throw l()}function G(e){const t=[];for(let n=0;n<e.length;n++){let s=e.charCodeAt(n);if(s<=127)t.push(s);else if(s<=2047)t.push(192|s>>6,128|63&s);else if(55296==(64512&s)){if(n<e.length-1&&56320==(64512&e.charCodeAt(n+1))){s=65536|(1023&s)<<10|1023&e.charCodeAt(++n),t.push(240|s>>18,128|s>>12&63,128|s>>6&63,128|63&s)}else t.push(239,191,189)}else 56320==(64512&s)?t.push(239,191,189):t.push(224|s>>12,128|s>>6&63,128|63&s)}return new Uint8Array(t)}function X(e){let t;try{t=decodeURIComponent(e)}catch(e){throw w(V.DATA_URL,'Malformed data URL.')}return G(t)}function K(e,t){switch(e){case V.BASE64:{const n=-1!==t.indexOf('-'),s=-1!==t.indexOf('_');if(n||s){throw w(e,"Invalid character '"+(n?'-':'_')+"' found: is it base64url encoded?")}break}case V.BASE64URL:{const n=-1!==t.indexOf('+'),s=-1!==t.indexOf('/');if(n||s){throw w(e,"Invalid character '"+(n?'+':'/')+"' found: is it base64 encoded?")}t=t.replace(/-/g,'+').replace(/_/g,'/');break}}let n;try{n=z(t)}catch(t){if(t.message.includes('polyfill'))throw t;throw w(e,'Invalid character found')}const s=new Uint8Array(n.length);for(let e=0;e<n.length;e++)s[e]=n.charCodeAt(e);return s}class Z{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(null===t)throw w(V.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const n=t[1]||null;null!=n&&(this.base64=Q(n,';base64'),this.contentType=this.base64?n.substring(0,n.length-7):n),this.rest=e.substring(e.indexOf(',')+1)}}function J(e){const t=new Z(e);return t.base64?K(V.BASE64,t.rest):X(t.rest)}function Y(e){return new Z(e).contentType}function Q(e,t){return!!(e.length>=t.length)&&e.substring(e.length-t.length)===t}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class ee{constructor(e,t){let n=0,s='';U(e)?(this.data_=e,n=e.size,s=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),n=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),n=e.length),this.size_=n,this.type_=s}size(){return this.size_}type(){return this.type_}slice(e,t){if(U(this.data_)){const n=H(this.data_,e,t);return null===n?null:new ee(n)}{const n=new Uint8Array(this.data_.buffer,e,t-e);return new ee(n,!0)}}static getBlob(...e){if(C()){const t=e.map(e=>e instanceof ee?e.data_:e);return new ee(F.apply(null,t))}{const t=e.map(e=>O(e)?$(V.RAW,e).data:e.data_);let n=0;t.forEach(e=>{n+=e.byteLength});const s=new Uint8Array(n);let o=0;return t.forEach(e=>{for(let t=0;t<e.length;t++)s[o++]=e[t]}),new ee(s,!0)}}uploadData(){return this.data_}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function te(e){let t;try{t=JSON.parse(e)}catch(e){return null}return'object'!=typeof(n=t)||Array.isArray(n)?null:t;var n}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function ne(e){if(0===e.length)return null;const t=e.lastIndexOf('/');if(-1===t)return'';return e.slice(0,t)}function re(e,t){const n=t.split('/').filter(e=>e.length>0).join('/');return 0===e.length?n:e+'/'+n}function se(e){const t=e.lastIndexOf('/',e.length-2);return-1===t?e:e.slice(t+1)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function oe(e,t){return t}class ie{constructor(e,t,n,s){this.server=e,this.local=t||e,this.writable=!!n,this.xform=s||oe}}let ae=null;function ue(e){return!O(e)||e.length<2?e:se(e)}function ce(){if(ae)return ae;const e=[];e.push(new ie('bucket')),e.push(new ie('generation')),e.push(new ie('metageneration')),e.push(new ie('name','fullPath',!0));const t=new ie('name');t.xform=function(e,t){return ue(t)},e.push(t);const n=new ie('size');return n.xform=function(e,t){return void 0!==t?Number(t):t},e.push(n),e.push(new ie('timeCreated')),e.push(new ie('updated')),e.push(new ie('md5Hash',null,!0)),e.push(new ie('cacheControl',null,!0)),e.push(new ie('contentDisposition',null,!0)),e.push(new ie('contentEncoding',null,!0)),e.push(new ie('contentLanguage',null,!0)),e.push(new ie('contentType',null,!0)),e.push(new ie('metadata','customMetadata',!0)),ae=e,ae}function le(e,t){Object.defineProperty(e,'ref',{get:function(){const n=e.bucket,s=e.fullPath,o=new k(n,s);return t._makeStorageReference(o)}})}function he(e,t,n){const s={type:'file'},o=n.length;for(let e=0;e<o;e++){const o=n[e];s[o.local]=o.xform(s,t[o.server])}return le(s,e),s}function de(e,t,n){const s=te(t);if(null===s)return null;return he(e,s,n)}function pe(e,t,n,s){const o=te(t);if(null===o)return null;if(!O(o.downloadTokens))return null;const i=o.downloadTokens;if(0===i.length)return null;const u=encodeURIComponent;return i.split(',').map(t=>{const o=e.bucket,i=e.fullPath;return P('/b/'+u(o)+'/o/'+u(i),n,s)+I({alt:'media',token:t})})[0]}function fe(e,t){const n={},s=t.length;for(let o=0;o<s;o++){const s=t[o];s.writable&&(n[s.server]=e[s.local])}return JSON.stringify(n)}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const ge='prefixes',me='items';function be(e,t,n){const s={prefixes:[],items:[],nextPageToken:n.nextPageToken};if(n[ge])for(const o of n[ge]){const n=o.replace(/\/$/,''),i=e._makeStorageReference(new k(t,n));s.prefixes.push(i)}if(n[me])for(const o of n[me]){const n=e._makeStorageReference(new k(t,o.name));s.items.push(n)}return s}function Te(e,t,n){const s=te(n);if(null===s)return null;return be(e,t,s)}class Re{constructor(e,t,n,s){this.url=e,this.method=t,this.handler=n,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function we(e){if(!e)throw l()}function ye(e,t){return function(n,s){const o=de(e,s,t);return we(null!==o),o}}function ke(e,t){return function(n,s){const o=Te(e,t,s);return we(null!==o),o}}function Ee(e,t){return function(n,s){const o=de(e,s,t);return we(null!==o),pe(o,s,e.host,e._protocol)}}function ve(e){return function(t,n){let s;var u,c;return 401===t.getStatus()?s=t.getErrorText().includes('Firebase App Check token is invalid')?new o(i.UNAUTHORIZED_APP,'This app does not have permission to access Firebase Storage on this project.'):new o(i.UNAUTHENTICATED,"User is not authenticated, please authenticate using Firebase Authentication and try again."):402===t.getStatus()?(c=e.bucket,s=new o(i.QUOTA_EXCEEDED,"Quota for bucket '"+c+"' exceeded, please view quota on https://firebase.google.com/pricing/.")):403===t.getStatus()?(u=e.path,s=new o(i.UNAUTHORIZED,"User does not have permission to access '"+u+"'.")):s=n,s.status=t.getStatus(),s.serverResponse=n.serverResponse,s}}function Oe(e){const t=ve(e);return function(n,s){let u=t(n,s);var c;return 404===n.getStatus()&&(c=e.path,u=new o(i.OBJECT_NOT_FOUND,"Object '"+c+"' does not exist.")),u.serverResponse=s.serverResponse,u}}function Ue(e,t,n){const s=P(t.fullServerUrl(),e.host,e._protocol),o=e.maxOperationRetryTime,i=new Re(s,'GET',ye(e,n),o);return i.errorHandler=Oe(t),i}function Ce(e,t,n,s,o){const i={};t.isRoot?i.prefix='':i.prefix=t.path+'/',n&&n.length>0&&(i.delimiter=n),s&&(i.pageToken=s),o&&(i.maxResults=o);const u=P(t.bucketOnlyServerUrl(),e.host,e._protocol),c=e.maxOperationRetryTime,l=new Re(u,'GET',ke(e,t.bucket),c);return l.urlParams=i,l.errorHandler=ve(t),l}function Ae(e,t,n){const s=P(t.fullServerUrl(),e.host,e._protocol)+'?alt=media',o=e.maxOperationRetryTime,i=new Re(s,'GET',(e,t)=>t,o);return i.errorHandler=Oe(t),void 0!==n&&(i.headers.Range=`bytes=0-${n}`,i.successCodes=[200,206]),i}function Pe(e,t,n){const s=P(t.fullServerUrl(),e.host,e._protocol),o=e.maxOperationRetryTime,i=new Re(s,'GET',Ee(e,n),o);return i.errorHandler=Oe(t),i}function Ie(e,t,n,s){const o=P(t.fullServerUrl(),e.host,e._protocol),i=fe(n,s),u=e.maxOperationRetryTime,c=new Re(o,'PATCH',ye(e,s),u);return c.headers={'Content-Type':'application/json; charset=utf-8'},c.body=i,c.errorHandler=Oe(t),c}function Se(e,t){const n=P(t.fullServerUrl(),e.host,e._protocol),s=e.maxOperationRetryTime;const o=new Re(n,'DELETE',function(e,t){},s);return o.successCodes=[200,204],o.errorHandler=Oe(t),o}function xe(e,t){return e&&e.contentType||t&&t.type()||'application/octet-stream'}function Ne(e,t,n){const s=Object.assign({},n);return s.fullPath=e.path,s.size=t.size(),s.contentType||(s.contentType=xe(null,t)),s}function De(e,t,n,s,o){const i=t.bucketOnlyServerUrl(),u={'X-Goog-Upload-Protocol':'multipart'};const c=(function(){let e='';for(let t=0;t<2;t++)e+=Math.random().toString().slice(2);return e})();u['Content-Type']='multipart/related; boundary='+c;const l=Ne(t,s,o),h='--'+c+"\r\nContent-Type: application/json; charset=utf-8\r\n\r\n"+fe(l,n)+'\r\n--'+c+"\r\nContent-Type: "+l.contentType+'\r\n\r\n',_='\r\n--'+c+'--',p=ee.getBlob(h,s,_);if(null===p)throw f();const b={name:l.fullPath},T=P(i,e.host,e._protocol),R=e.maxUploadRetryTime,w=new Re(T,'POST',ye(e,n),R);return w.urlParams=b,w.headers=u,w.body=p.uploadData(),w.errorHandler=ve(t),w}class Le{constructor(e,t,n,s){this.current=e,this.total=t,this.finalized=!!n,this.metadata=s||null}}function Me(e,t){let n=null;try{n=e.getResponseHeader('X-Goog-Upload-Status')}catch(e){we(!1)}return we(!!n&&-1!==(t||['active']).indexOf(n)),n}function Be(e,t,n,s,o){const i=t.bucketOnlyServerUrl(),u=Ne(t,s,o),c={name:u.fullPath},l=P(i,e.host,e._protocol),h={'X-Goog-Upload-Protocol':'resumable','X-Goog-Upload-Command':'start','X-Goog-Upload-Header-Content-Length':`${s.size()}`,'X-Goog-Upload-Header-Content-Type':u.contentType,'Content-Type':'application/json; charset=utf-8'},_=fe(u,n),p=e.maxUploadRetryTime;const f=new Re(l,'POST',function(e){let t;Me(e);try{t=e.getResponseHeader('X-Goog-Upload-URL')}catch(e){we(!1)}return we(O(t)),t},p);return f.urlParams=c,f.headers=h,f.body=_,f.errorHandler=ve(t),f}function je(e,t,n,s){const o=e.maxUploadRetryTime,i=new Re(n,'POST',function(e){const t=Me(e,['active','final']);let n=null;try{n=e.getResponseHeader('X-Goog-Upload-Size-Received')}catch(e){we(!1)}n||we(!1);const o=Number(n);return we(!isNaN(o)),new Le(o,s.size(),'final'===t)},o);return i.headers={'X-Goog-Upload-Command':'query'},i.errorHandler=ve(t),i}const qe=262144;function Fe(e,t,n,s,u,c,l,h){const _=new Le(0,0);if(l?(_.current=l.current,_.total=l.total):(_.current=0,_.total=s.size()),s.size()!==_.total)throw new o(i.SERVER_FILE_WRONG_SIZE,'Server recorded incorrect upload file size, please retry the upload.');const p=_.total-_.current;let b=p;u>0&&(b=Math.min(b,u));const T=_.current,R=T+b;let w='';w=0===b?'finalize':p===b?'upload, finalize':'upload';const y={'X-Goog-Upload-Command':w,'X-Goog-Upload-Offset':`${_.current}`},k=s.slice(T,R);if(null===k)throw f();const E=t.maxUploadRetryTime,v=new Re(n,'POST',function(e,n){const o=Me(e,['active','final']),i=_.current+b,u=s.size();let l;return l='final'===o?ye(t,c)(e,n):null,new Le(i,u,'final'===o,l)},E);return v.headers=y,v.body=k.uploadData(),v.progressCallback=h||null,v.errorHandler=ve(e),v}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const He={STATE_CHANGED:'state_changed'},ze={RUNNING:'running',PAUSED:'paused',SUCCESS:'success',CANCELED:'canceled',ERROR:'error'};function Ve(e){switch(e){case"running":case"pausing":case"canceling":return ze.RUNNING;case"paused":return ze.PAUSED;case"success":return ze.SUCCESS;case"canceled":return ze.CANCELED;default:return ze.ERROR}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class We{constructor(e,t,n){if('function'==typeof e||null!=t||null!=n)this.next=e,this.error=null!=t?t:void 0,this.complete=null!=n?n:void 0;else{const t=e;this.next=t.next,this.error=t.error,this.complete=t.complete}}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function $e(e){return(...t)=>{Promise.resolve().then(()=>e(...t))}}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class Ge{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=u.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener('abort',()=>{this.errorCode_=u.ABORT,e()}),this.xhr_.addEventListener('error',()=>{this.errorCode_=u.NETWORK_ERROR,e()}),this.xhr_.addEventListener('load',()=>{e()})})}send(e,n,s,o,i){if(this.sent_)throw y('cannot .send() more than once');if((0,t.isCloudWorkstation)(e)&&s&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(n,e,!0),void 0!==i)for(const e in i)i.hasOwnProperty(e)&&this.xhr_.setRequestHeader(e,i[e].toString());return void 0!==o?this.xhr_.send(o):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw y('cannot .getErrorCode() before sending');return this.errorCode_}getStatus(){if(!this.sent_)throw y('cannot .getStatus() before sending');try{return this.xhr_.status}catch(e){return-1}}getResponse(){if(!this.sent_)throw y('cannot .getResponse() before sending');return this.xhr_.response}getErrorText(){if(!this.sent_)throw y('cannot .getErrorText() before sending');return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){null!=this.xhr_.upload&&this.xhr_.upload.addEventListener('progress',e)}removeUploadProgressListener(e){null!=this.xhr_.upload&&this.xhr_.upload.removeEventListener('progress',e)}}class Xe extends Ge{initXhr(){this.xhr_.responseType='text'}}function Ke(){return new Xe}class Ze extends Ge{initXhr(){this.xhr_.responseType='arraybuffer'}}function Je(){return new Ze}class Ye extends Ge{initXhr(){this.xhr_.responseType='blob'}}function Qe(){return new Ye}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class et{isExponentialBackoffExpired(){return this.sleepTime>this.maxSleepTime}constructor(e,t,n=null){this._transferred=0,this._needToFetchStatus=!1,this._needToFetchMetadata=!1,this._observers=[],this._error=void 0,this._uploadUrl=void 0,this._request=void 0,this._chunkMultiplier=1,this._resolve=void 0,this._reject=void 0,this._ref=e,this._blob=t,this._metadata=n,this._mappings=ce(),this._resumable=this._shouldDoResumable(this._blob),this._state="running",this._errorHandler=e=>{if(this._request=void 0,this._chunkMultiplier=1,e._codeEquals(i.CANCELED))this._needToFetchStatus=!0,this.completeTransitions_();else{const t=this.isExponentialBackoffExpired();if(S(e.status,[])){if(!t)return this.sleepTime=Math.max(2*this.sleepTime,1e3),this._needToFetchStatus=!0,void this.completeTransitions_();e=h()}this._error=e,this._transition("error")}},this._metadataErrorHandler=e=>{this._request=void 0,e._codeEquals(i.CANCELED)?this.completeTransitions_():(this._error=e,this._transition("error"))},this.sleepTime=0,this.maxSleepTime=this._ref.storage.maxUploadRetryTime,this._promise=new Promise((e,t)=>{this._resolve=e,this._reject=t,this._start()}),this._promise.then(null,()=>{})}_makeProgressCallback(){const e=this._transferred;return t=>this._updateProgress(e+t)}_shouldDoResumable(e){return e.size()>262144}_start(){"running"===this._state&&void 0===this._request&&(this._resumable?void 0===this._uploadUrl?this._createResumable():this._needToFetchStatus?this._fetchStatus():this._needToFetchMetadata?this._fetchMetadata():this.pendingTimeout=setTimeout(()=>{this.pendingTimeout=void 0,this._continueUpload()},this.sleepTime):this._oneShotUpload())}_resolveToken(e){Promise.all([this._ref.storage._getAuthToken(),this._ref.storage._getAppCheckToken()]).then(([t,n])=>{switch(this._state){case"running":e(t,n);break;case"canceling":this._transition("canceled");break;case"pausing":this._transition("paused")}})}_createResumable(){this._resolveToken((e,t)=>{const n=Be(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),s=this._ref.storage._makeRequest(n,Ke,e,t);this._request=s,s.getPromise().then(e=>{this._request=void 0,this._uploadUrl=e,this._needToFetchStatus=!1,this.completeTransitions_()},this._errorHandler)})}_fetchStatus(){const e=this._uploadUrl;this._resolveToken((t,n)=>{const s=je(this._ref.storage,this._ref._location,e,this._blob),o=this._ref.storage._makeRequest(s,Ke,t,n);this._request=o,o.getPromise().then(e=>{this._request=void 0,this._updateProgress(e.current),this._needToFetchStatus=!1,e.finalized&&(this._needToFetchMetadata=!0),this.completeTransitions_()},this._errorHandler)})}_continueUpload(){const e=qe*this._chunkMultiplier,t=new Le(this._transferred,this._blob.size()),n=this._uploadUrl;this._resolveToken((s,o)=>{let i;try{i=Fe(this._ref._location,this._ref.storage,n,this._blob,e,this._mappings,t,this._makeProgressCallback())}catch(e){return this._error=e,void this._transition("error")}const u=this._ref.storage._makeRequest(i,Ke,s,o,!1);this._request=u,u.getPromise().then(e=>{this._increaseMultiplier(),this._request=void 0,this._updateProgress(e.current),e.finalized?(this._metadata=e.metadata,this._transition("success")):this.completeTransitions_()},this._errorHandler)})}_increaseMultiplier(){2*(qe*this._chunkMultiplier)<33554432&&(this._chunkMultiplier*=2)}_fetchMetadata(){this._resolveToken((e,t)=>{const n=Ue(this._ref.storage,this._ref._location,this._mappings),s=this._ref.storage._makeRequest(n,Ke,e,t);this._request=s,s.getPromise().then(e=>{this._request=void 0,this._metadata=e,this._transition("success")},this._metadataErrorHandler)})}_oneShotUpload(){this._resolveToken((e,t)=>{const n=De(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),s=this._ref.storage._makeRequest(n,Ke,e,t);this._request=s,s.getPromise().then(e=>{this._request=void 0,this._metadata=e,this._updateProgress(this._blob.size()),this._transition("success")},this._errorHandler)})}_updateProgress(e){const t=this._transferred;this._transferred=e,this._transferred!==t&&this._notifyObservers()}_transition(e){if(this._state!==e)switch(e){case"canceling":case"pausing":this._state=e,void 0!==this._request?this._request.cancel():this.pendingTimeout&&(clearTimeout(this.pendingTimeout),this.pendingTimeout=void 0,this.completeTransitions_());break;case"running":const t="paused"===this._state;this._state=e,t&&(this._notifyObservers(),this._start());break;case"paused":case"error":case"success":this._state=e,this._notifyObservers();break;case"canceled":this._error=_(),this._state=e,this._notifyObservers()}}completeTransitions_(){switch(this._state){case"pausing":this._transition("paused");break;case"canceling":this._transition("canceled");break;case"running":this._start()}}get snapshot(){const e=Ve(this._state);return{bytesTransferred:this._transferred,totalBytes:this._blob.size(),state:e,metadata:this._metadata,task:this,ref:this._ref}}on(e,t,n,s){const o=new We(t||void 0,n||void 0,s||void 0);return this._addObserver(o),()=>{this._removeObserver(o)}}then(e,t){return this._promise.then(e,t)}catch(e){return this.then(null,e)}_addObserver(e){this._observers.push(e),this._notifyObserver(e)}_removeObserver(e){const t=this._observers.indexOf(e);-1!==t&&this._observers.splice(t,1)}_notifyObservers(){this._finishPromise();this._observers.slice().forEach(e=>{this._notifyObserver(e)})}_finishPromise(){if(void 0!==this._resolve){let e=!0;switch(Ve(this._state)){case ze.SUCCESS:$e(this._resolve.bind(null,this.snapshot))();break;case ze.CANCELED:case ze.ERROR:$e(this._reject.bind(null,this._error))();break;default:e=!1}e&&(this._resolve=void 0,this._reject=void 0)}}_notifyObserver(e){switch(Ve(this._state)){case ze.RUNNING:case ze.PAUSED:e.next&&$e(e.next.bind(e,this.snapshot))();break;case ze.SUCCESS:e.complete&&$e(e.complete.bind(e))();break;case ze.CANCELED:case ze.ERROR:default:e.error&&$e(e.error.bind(e,this._error))()}}resume(){const e="paused"===this._state||"pausing"===this._state;return e&&this._transition("running"),e}pause(){const e="running"===this._state;return e&&this._transition("pausing"),e}cancel(){const e="running"===this._state||"pausing"===this._state;return e&&this._transition("canceling"),e}}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class tt{constructor(e,t){this._service=e,this._location=t instanceof k?t:k.makeFromUrl(t,e.host)}toString(){return'gs://'+this._location.bucket+'/'+this._location.path}_newRef(e,t){return new tt(e,t)}get root(){const e=new k(this._location.bucket,'');return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return se(this._location.path)}get storage(){return this._service}get parent(){const e=ne(this._location.path);if(null===e)return null;const t=new k(this._location.bucket,e);return new tt(this._service,t)}_throwIfRoot(e){if(''===this._location.path)throw R(e)}}function nt(e,t){e._throwIfRoot('getBytes');const n=Ae(e.storage,e._location,t);return e.storage.makeRequestWithTokens(n,Je).then(e=>void 0!==t?e.slice(0,t):e)}function rt(e,t){e._throwIfRoot('getBlob');const n=Ae(e.storage,e._location,t);return e.storage.makeRequestWithTokens(n,Qe).then(e=>void 0!==t?e.slice(0,t):e)}function st(e,t,n){e._throwIfRoot('uploadBytes');const s=De(e.storage,e._location,ce(),new ee(t,!0),n);return e.storage.makeRequestWithTokens(s,Ke).then(t=>({metadata:t,ref:e}))}function ot(e,t,n){return e._throwIfRoot('uploadBytesResumable'),new et(e,new ee(t),n)}function it(e,t,n=V.RAW,s){e._throwIfRoot('uploadString');const o=$(n,t),i=Object.assign({},s);return null==i.contentType&&null!=o.contentType&&(i.contentType=o.contentType),st(e,o.data,i)}function at(e){const t={prefixes:[],items:[]};return ut(e,t).then(()=>t)}async function ut(e,t,n){const s={pageToken:n},o=await ct(e,s);t.prefixes.push(...o.prefixes),t.items.push(...o.items),null!=o.nextPageToken&&await ut(e,t,o.nextPageToken)}function ct(e,t){null!=t&&'number'==typeof t.maxResults&&A('options.maxResults',1,1e3,t.maxResults);const n=t||{},s=Ce(e.storage,e._location,'/',n.pageToken,n.maxResults);return e.storage.makeRequestWithTokens(s,Ke)}function lt(e){e._throwIfRoot('getMetadata');const t=Ue(e.storage,e._location,ce());return e.storage.makeRequestWithTokens(t,Ke)}function ht(e,t){e._throwIfRoot('updateMetadata');const n=Ie(e.storage,e._location,t,ce());return e.storage.makeRequestWithTokens(n,Ke)}function dt(e){e._throwIfRoot('getDownloadURL');const t=Pe(e.storage,e._location,ce());return e.storage.makeRequestWithTokens(t,Ke).then(e=>{if(null===e)throw new o(i.NO_DOWNLOAD_URL,'The given file does not have any download URLs.');return e})}function _t(e){e._throwIfRoot('deleteObject');const t=Se(e.storage,e._location);return e.storage.makeRequestWithTokens(t,Ke)}function pt(e,t){const n=re(e._location.path,t),s=new k(e._location.bucket,n);return new tt(e.storage,s)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function ft(e,t){if(e instanceof Tt){const n=e;if(null==n._bucket)throw new o(i.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the 'storageBucket' property when initializing the app?");const s=new tt(n,n._bucket);return null!=t?ft(s,t):s}return void 0!==t?pt(e,t):e}function gt(e,t){if(t&&/^[A-Za-z]+:\/\//.test(t)){if(e instanceof Tt)return new tt(e,t);throw b('To use ref(service, url), the first argument must be a Storage instance.')}return ft(e,t)}function mt(e,t){const n=null==t?void 0:t.storageBucket;return null==n?null:k.makeFromBucketSpec(n,e)}function bt(e,n,s,o={}){e.host=`${n}:${s}`;const i=(0,t.isCloudWorkstation)(n);i&&((0,t.pingServer)(`https://${e.host}/b`),(0,t.updateEmulatorBanner)('Storage',!0)),e._isUsingEmulator=!0,e._protocol=i?'https':'http';const{mockUserToken:u}=o;u&&(e._overrideAuthToken='string'==typeof u?u:(0,t.createMockUserToken)(u,e.app.options.projectId))}class Tt{constructor(e,t,n,o,i,u=!1){this.app=e,this._authProvider=t,this._appCheckProvider=n,this._url=o,this._firebaseVersion=i,this._isUsingEmulator=u,this._bucket=null,this._host=s,this._protocol='https',this._appId=null,this._deleted=!1,this._maxOperationRetryTime=12e4,this._maxUploadRetryTime=6e5,this._requests=new Set,this._bucket=null!=o?k.makeFromBucketSpec(o,this._host):mt(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,null!=this._url?this._bucket=k.makeFromBucketSpec(this._url,e):this._bucket=mt(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){A('time',0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){A('time',0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(null!==t)return t.accessToken}return null}async _getAppCheckToken(){if((0,e._isFirebaseServerApp)(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const t=this._appCheckProvider.getImmediate({optional:!0});if(t){return(await t.getToken()).token}return null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new tt(this,e)}_makeRequest(e,t,n,s,o=!0){if(this._deleted)return new E(T());{const i=j(e,this._appId,n,s,t,this._firebaseVersion,o,this._isUsingEmulator);return this._requests.add(i),i.getPromise().then(()=>this._requests.delete(i),()=>this._requests.delete(i)),i}}async makeRequestWithTokens(e,t){const[n,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,n,s).getPromise()}}const Rt="@firebase/storage",wt="0.13.14",yt='storage';
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function kt(e,n){return nt(e=(0,t.getModularInstance)(e),n)}function Et(e,n,s){return st(e=(0,t.getModularInstance)(e),n,s)}function vt(e,n,s,o){return it(e=(0,t.getModularInstance)(e),n,s,o)}function Ot(e,n,s){return ot(e=(0,t.getModularInstance)(e),n,s)}function Ut(e){return lt(e=(0,t.getModularInstance)(e))}function Ct(e,n){return ht(e=(0,t.getModularInstance)(e),n)}function At(e,n){return ct(e=(0,t.getModularInstance)(e),n)}function Pt(e){return at(e=(0,t.getModularInstance)(e))}function It(e){return dt(e=(0,t.getModularInstance)(e))}function St(e){return _t(e=(0,t.getModularInstance)(e))}function xt(e,n){return gt(e=(0,t.getModularInstance)(e),n)}function Nt(e,t){return pt(e,t)}function Dt(n=(0,e.getApp)(),s){n=(0,t.getModularInstance)(n);const o=(0,e._getProvider)(n,yt).getImmediate({identifier:s}),i=(0,t.getDefaultEmulatorHostnameAndPort)('storage');return i&&Lt(o,...i),o}function Lt(e,t,n,s={}){bt(e,t,n,s)}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Mt(e,n){return rt(e=(0,t.getModularInstance)(e),n)}function Bt(e,t){throw new Error('getStream() is only supported by NodeJS builds')}function jt(t,{instanceIdentifier:n}){const s=t.getProvider('app').getImmediate(),o=t.getProvider('auth-internal'),i=t.getProvider('app-check-internal');return new Tt(s,o,i,n,e.SDK_VERSION)}(0,e._registerComponent)(new n.Component(yt,jt,"PUBLIC").setMultipleInstances(!0)),(0,e.registerVersion)(Rt,wt,''),(0,e.registerVersion)(Rt,wt,'esm2017')},815,[754,756,755]);
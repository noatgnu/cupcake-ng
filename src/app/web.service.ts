import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import {environment} from "../environments/environment";
import {map, Observable} from "rxjs";
import {
  Protocol,
  ProtocolQuery,
  ProtocolSection,
  ProtocolStep
} from "./protocol";
import {ProtocolSession, ProtocolSessionQuery} from "./protocol-session";
import {TimeKeeper} from "./time-keeper";
import {Annotation, AnnotationFolder, AnnotationQuery} from "./annotation";
import {ReagentQuery, ProtocolReagent, ProtocolStepReagent} from "./reagent";
import {ProtocolTag, ProtocolTagQuery, StepTag, StepTagQuery, TagQuery} from "./tag";
import {Project, ProjectQuery} from "./project";
import {Instrument, InstrumentQuery, InstrumentUsage, InstrumentUsageQuery} from "./instrument";
import {
  ReagentAction,
  ReagentActionQuery,
  StorageObject,
  StorageObjectQuery,
  StoredReagent,
  StoredReagentQuery
} from "./storage-object";
import {MetadataColumn, MetadataTableTemplate, MetadataTableTemplateQuery} from "./metadata-column";
import {LabGroup, LabGroupQuery} from "./lab-group";
import {HumanDiseaseQuery} from "./human-disease";
import {SubcellularLocation, SubcellularLocationQuery} from "./subcellular-location";
import {Tissue, TissueQuery} from "./tissue";
import {Species, SpeciesQuery} from "./species";
import {MsVocabQuery} from "./ms-vocab";
import {NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {User, UserQuery} from "./user";
import {UnimodQuery} from "./unimod";
import {InstrumentJob, InstrumentJobQuery} from "./instrument-job";
import {FavouriteMetadataOption, FavouriteMetadataOptionQuery} from "./favourite-metadata-option";
import {Preset, PresetQuery} from "./preset";


@Injectable({
  providedIn: 'root'
})
export class WebService {
  cupcakeInstanceID: string = crypto.randomUUID()
  baseURL: string = environment.baseURL;
  reagentActionDeleteExpireMinutes: number = 5

  constructor(private http: HttpClient) { }

  postProtocol(url: string): Observable<Protocol> {
    return this.http.post<Protocol>(
      `${this.baseURL}/api/protocol/`,
      {"url": url},
      {responseType: 'json', observe: 'body'}
    );
  }

  getProtocol(id: number|string): Observable<Protocol> {
    return this.http.get<Protocol>(
      `${this.baseURL}/api/protocol/${id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAssociatedSessions(protocol_id: number|string): Observable<ProtocolSession[]> {
    return this.http.get<ProtocolSession[]>(
      `${this.baseURL}/api/protocol/${protocol_id}/get_associated_sessions/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  createSession(protocol_ids: number[]|string[] = []): Observable<ProtocolSession> {
    if (protocol_ids.length === 0) {
      return this.http.post<ProtocolSession>(
        `${this.baseURL}/api/session/`,
        {},
        {responseType: 'json', observe: 'body'}
      );
    }
    return this.http.post<ProtocolSession>(
      `${this.baseURL}/api/session/`,
      {protocol_ids: protocol_ids},
      {responseType: 'json', observe: 'body'}
    );
  }

  getProtocolSession(id: number|string): Observable<ProtocolSession> {
    return this.http.get<ProtocolSession>(
      `${this.baseURL}/api/session/${id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  postStepTimeKeeper(session_id: number|string, step_id: number|string, started: boolean = false, start_date: Date|null = null, current_duration: number = 0): Observable<TimeKeeper> {
    const body: any = {session: session_id, step: step_id, started: started};
    if (start_date !== null) {
      body["start_time"] = start_date;
    }
    if (current_duration !== 0) {
      body["current_duration"] = current_duration;
    }
    console.log(body)
    return this.http.post<TimeKeeper>(
`${this.baseURL}/api/timekeeper/`,
      body,
      {responseType: 'json', observe: 'body'}
    );
  }

  updateTimeKeeper(id: number|string, started: boolean = false, start_date: Date|null = null, current_duration: number|null = null): Observable<TimeKeeper> {
    const body: any = {started: started};
    if (start_date !== null) {
      body["start_time"] = start_date;
    }
    if (current_duration !== null) {
      body["current_duration"] = current_duration;
    }
    return this.http.put<TimeKeeper>(
      `${this.baseURL}/api/timekeeper/${id}/`,
      body,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveAnnotationText(session_id: string|undefined|null, step_id: number = 0, text: string, instrument_job_id: number|null|undefined = null, instrument_user_type: null|'user_annotation'|'staff_annotation' = null, stored_reagent_id: number|null = null) {
    const form = new FormData();
    form.append('annotation', text);
    form.append('annotation_type', 'text');
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    if (session_id) {
      form.append('session', session_id);
    }
    if (instrument_job_id) {
      form.append('instrument_job', instrument_job_id.toString());
    }
    if (instrument_user_type) {
      form.append('instrument_user_type', instrument_user_type);
    }
    if (stored_reagent_id) {
      form.append('stored_reagent', stored_reagent_id.toString());
    }
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAnnotations(session_id: string, step_id: number): Observable<AnnotationQuery> {
    let params = new HttpParams()
    params = params.set('session', session_id);
    params = params.set('step', step_id.toString());
    params = params.set('ordering', '-created_at');
    return this.http.get<AnnotationQuery>(
      `${this.baseURL}/api/annotation/`,
      {responseType: 'json', observe: 'body', params: params}
    );
  }

  getAnnotationsURL(url: string): Observable<AnnotationQuery> {
    return this.http.get<AnnotationQuery>(
      url,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveAnnotationFile(session_id: string|undefined|null, step_id: number = 0, file: File, annotation_type: string = 'file', instrument_job_id: number|null|undefined = null, instrument_user_type: null|'user_annotation'|'staff_annotation' = null, annotation: string = "", stored_reagent_id: number|null = null) {
    const form = new FormData()
    if (annotation) {
      form.append('annotation', annotation);
    } else {
      form.append('annotation', "");
    }
    form.append('annotation_type', annotation_type);
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    if (session_id) {
      form.append('session', session_id);
    }
    if (instrument_job_id) {
      form.append('instrument_job', instrument_job_id.toString());
    }
    if (instrument_user_type) {
      form.append('instrument_user_type', instrument_user_type);
    }
    if (stored_reagent_id) {
      form.append('stored_reagent', stored_reagent_id.toString());
    }
    form.append('file', file);
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveSketch(session_id: string|undefined|null, step_id: number = 0, strokes: any[],  instrument_job_id: number|null|undefined = null, instrument_user_type: null|'user_annotation'|'staff_annotation' = null, stored_reagent_id: number|null = null) {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', 'sketch');
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    if (session_id) {
      form.append('session', session_id);
    }
    if (instrument_job_id) {
      form.append('instrument_job', instrument_job_id.toString());
    }
    if (instrument_user_type) {
      form.append('instrument_user_type', instrument_user_type);
    }
    if (stored_reagent_id) {
      form.append('stored_reagent', stored_reagent_id.toString());
    }
    const file = new File([JSON.stringify(strokes)], 'sketch.json', {type: 'application/json'});
    form.append('file', file);
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveAnnotationJSON(session_id: string|undefined|null, step_id: number = 0, json: any, annotation_type: string, instrument_job_id: number|null|undefined = null, instrument_user_type: null|'user_annotation'|'staff_annotation' = null, stored_reagent_id: number|null = null) {
    const form = new FormData()
    form.append('annotation', JSON.stringify(json));
    form.append('annotation_type', annotation_type);
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    if (session_id) {
      form.append('session', session_id);
    }
    if (instrument_job_id) {
      form.append('instrument_job', instrument_job_id.toString());
    }
    if (instrument_user_type) {
      form.append('instrument_user_type', instrument_user_type);
    }
    if (stored_reagent_id) {
      form.append('stored_reagent', stored_reagent_id.toString());
    }
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );

  }

  getDownloadURL(url: string) {
    return this.http.get(
      url,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAnnotationFile(id: number|string, responseText: boolean = false): Observable<any> {
    if (responseText) {
      return this.http.get<any>(
        `${this.baseURL}/api/annotation/${id}/download_file/`,
        {responseType: 'text' as 'json', observe: 'body'}
      );
    }
    return this.http.get<any>(
      `${this.baseURL}/api/annotation/${id}/download_file/`,
      {observe: 'body'}
    );
  }

  deleteAnnotation(id: number|string) {
    return this.http.delete(
      `${this.baseURL}/api/annotation/${id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAnnotationImageBlobUrl(id: number|string) {
    return this.http.get(
      `${this.baseURL}/api/annotation/${id}/download_file/`,
      {responseType: 'blob', observe: 'body'}
    ).pipe(map((blob: Blob) => URL.createObjectURL(blob)));
  }

  getSignedURL(annotation_id: number) {
    return this.http.post(
      `${this.baseURL}/api/annotation/${annotation_id}/get_signed_url/`,
      {},
      {responseType: 'json', observe: 'body'}
    )
  }

  saveMediaRecorderBlob(session_id: string|undefined|null, step_id: number|undefined|null, blob: Blob, annotation_type: string, instrument_job_id: number|null|undefined = null, instrument_user_type: null|'user_annotation'|'staff_annotation' = null, stored_reagent_id: number|null = null) {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', annotation_type);
    if (step_id) {
      form.append('step', step_id.toString());
    }
    if (session_id) {
      form.append('session', session_id);
    }
    if (instrument_job_id) {
      form.append('instrument_job', instrument_job_id.toString());
    }
    if (instrument_user_type) {
      form.append('instrument_user_type', instrument_user_type);
    }
    let file: File
    if (annotation_type === 'audio') {
      file = new File([blob], `recording${annotation_type}.webm`, {type: 'audio/webm'});
    } else {
      file = new File([blob], `recording${annotation_type}.webm`, {type: 'video/webm'});
    }
    if (stored_reagent_id) {
      form.append('stored_reagent', stored_reagent_id.toString());
    }

    form.append('file', file);
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );

  }

  createProtocol(protocol_title: string, protocol_description: string) {
    return this.http.post<Protocol>(
      `${this.baseURL}/api/protocol/`,
      {protocol_title: protocol_title, protocol_description: protocol_description},
      {responseType: 'json', observe: 'body'}
    );
  }

  createProtocolStep(protocol_id: number, step_description: string, step_duration: number, step_section: number) {
    return this.http.post<ProtocolStep>(
      `${this.baseURL}/api/step/`,
      {step_description: step_description, step_duration: step_duration, step_section: step_section, protocol: protocol_id},
      {responseType: 'json', observe: 'body'}
    );
  }

  updateProtocolStep(step_id: number, step_description: string, step_duration: number) {
    return this.http.patch<ProtocolStep>(
      `${this.baseURL}/api/step/${step_id}/`,
      {
        step_description: step_description,
        step_duration: step_duration
      },
      {responseType: 'json', observe: 'body'}
    );
  }

  deleteProtocolStep(step_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/step/${step_id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  moveProtocolStep(step_id: number, up: boolean = true) {
    let url = `${this.baseURL}/api/step/${step_id}/move_up/`
    if (!up) {
      url = `${this.baseURL}/api/step/${step_id}/move_down/`
    }
    return this.http.patch<ProtocolStep>(url, {}, {responseType: 'json', observe: 'body'})
  }

  createProtocolSection(protocol_id: number, section_description: string, section_duration: number) {
    return this.http.post<ProtocolSection>(
      `${this.baseURL}/api/section/`,
      {section_description: section_description, section_duration: section_duration, protocol: protocol_id},
      {responseType: 'json', observe: 'body'}
    );
  }

  updateProtocolSection(section_id: number, section_description: string, section_duration: number) {
    return this.http.put<ProtocolSection>(
      `${this.baseURL}/api/section/${section_id}/`,
      {
        section_description: section_description,
        section_duration: section_duration
      },
      {responseType: 'json', observe: 'body'}
    );
  }

  deleteSection(section_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/section/${section_id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getUserProtocols(url?: string, limit: number = 5, offset: number = 0, searchTerm: string = "") {
    if (url) {
      return this.http.get<ProtocolQuery>(
        url,
        {responseType: 'json', observe: 'body'}
      );
    }

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (searchTerm !== "") {
      params =params.append('search', searchTerm);
    }
    console.log(params)
    return this.http.get<ProtocolQuery>(
      `${this.baseURL}/api/protocol/get_user_protocols/`,
      {responseType: 'json', observe: 'body', params: params},
    );
  }

  changeUserPassword(old_password: string, new_password: string) {
    return this.http.post(
      `${this.baseURL}/api/user/change_password/`,
      {old_password: old_password, password: new_password},
      {responseType: 'json', observe: 'body'}
    );
  }

  postTranscribeRequest(annotation_id: number, language: string, model: string) {
    return this.http.post(
      `${this.baseURL}/api/annotation/${annotation_id}/retranscribe/`,
      {language: language, model: model},
      {responseType: 'json', observe: 'body'}
    );
  }

  exportToDocx(protocol_id: number, session_id: string = "", format: string = "docx") {
    const body: any = {export_type: "session", format: format};
    if (session_id !== "") {
      body["session"] = session_id;
    } else {
      body["export_type"] = "protocol";
    }
    if (format === "cupcake") {
      body["export_type"] = "session-sqlite"
    }
    return this.http.post(
      `${this.baseURL}/api/protocol/${protocol_id}/create_export/`,
      body,
      {responseType: 'json', observe: 'body'}
    );
  }

  exportUserData() {
    return this.http.post(
      `${this.baseURL}/api/user/export_data/`,
      {},
      {responseType: 'json', observe: 'body'}
    );
  }

  postSummaryRequest(prompt: string, target: any = {}) {
    return this.http.post(
      `${this.baseURL}/api/user/summarize_prompt/`,
      {prompt: prompt, target: target},
      {responseType: 'json', observe: 'body'}
    );
  }

  postSummarizeStep(step_ids: number[], target: any, current_step: number) {
    return this.http.post(
      `${this.baseURL}/api/user/summarize_steps/`,
      {steps: step_ids, target: target, current_step: current_step},
      {responseType: 'json', observe: 'body'}
    );
  }

  updateAnnotation(content: string, annotation_type: string, annotation_id: number) {
    const form = new FormData()
    if (['text', 'checklist', 'counter', 'table', 'alignment', 'calculator', 'mcalculator'].includes(annotation_type)) {
      form.append('annotation', content);
    } else {
      form.append('annotation', "");
      const file = new File([content], `annotation.${annotation_type}`, {type: `application/json`});
      form.append('file', file);
    }
    form.append('annotation_type', annotation_type);
    return this.http.put<Annotation>(
      `${this.baseURL}/api/annotation/${annotation_id}/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  updateTranscription(annotation_id: number, transcription: string) {
    return this.http.put(
      `${this.baseURL}/api/annotation/${annotation_id}/`,
      {transcription: transcription},
      {responseType: 'json', observe: 'body'}
    );
  }

  updateTranslation(annotation_id: number, translation: string) {
    return this.http.put(
      `${this.baseURL}/api/annotation/${annotation_id}/`,
      {translation: translation},
      {responseType: 'json', observe: 'body'}
    );
  }

  updateProtocol(protocol_id: number, protocol_title: string, protocol_description: string, enabled: boolean|null) {
    const payload: any = {protocol_title: protocol_title, protocol_description: protocol_description};
    if (enabled !== null) {
      payload["enabled"] = enabled;
    }
    return this.http.put<Protocol>(
      `${this.baseURL}/api/protocol/${protocol_id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    );
  }

  checkProtocolPermissions(protocol_id: number) {
    return this.http.post(
      `${this.baseURL}/api/user/check_protocol_permission/`,
      {'protocol': protocol_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  checkSessionPermissions(session_id: string) {
    return this.http.post(
      `${this.baseURL}/api/user/check_session_permission/`,
      {'session': session_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  checkAnnotationPermissions(annotation_id: number[]) {
    return this.http.post<{annotation: number, permission: {view: boolean, delete: boolean, edit: boolean}}[]>(
      `${this.baseURL}/api/user/check_annotation_permission/`,
      {'annotations': annotation_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  updateProtocolSession(session_id: string, name: string, enabled: boolean, started_at: Date|null = null, ended_at: Date|null = null) {


    return this.http.put<ProtocolSession>(
      `${this.baseURL}/api/session/${session_id}/`,
      {enabled: enabled, name: name, started_at: started_at, ended_at: ended_at},
      {responseType: 'json', observe: 'body'}
    );
  }

  sketchOCR(annotation_id: number) {
    return this.http.post(
      `${this.baseURL}/api/annotation/${annotation_id}/ocr/`,
      {},
      {responseType: 'json', observe: 'body'}
    )
  }

  getUserSessions(url?: string, limit: number = 5, offset: number = 0, searchTerm: string = "") {
    if (url) {
      return this.http.get<ProtocolSessionQuery>(
        url,
        {responseType: 'json', observe: 'body'}
      );
    }
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (searchTerm !== "") {
      params = params.append('search', searchTerm);
    }
    return this.http.get<ProtocolSessionQuery>(
      `${this.baseURL}/api/session/get_user_sessions/`,
      {responseType: 'json', observe: 'body', params: params}
    );
  }
  getAssociatedProtocolTitles(session_id: string) {
    return this.http.get<Protocol[]>(
      `${this.baseURL}/api/session/${session_id}/get_associated_protocol_titles/`,
      {responseType: 'json', observe: 'body'}
    );
  }
  searchProtocols(url: string = "", search: string) {
    if (url !== "") {
      return this.http.get<ProtocolQuery>(
        url,
        {responseType: 'json', observe: 'body'}
      );
    }
    return this.http.get<ProtocolQuery>(
      `${this.baseURL}/api/protocol/?search=${search}`,
      {responseType: 'json', observe: 'body'}
    );
  }

  sessionAddProtocol(session_id: string, protocol_id: number) {
    return this.http.post<ProtocolSession>(
      `${this.baseURL}/api/session/${session_id}/add_protocol/`,
      {protocol: protocol_id},
      {responseType: 'json', observe: 'body'}
    );
  }

  sessionRemoveProtocol(session_id: string, protocol_id: number) {
    return this.http.post<ProtocolSession>(
      `${this.baseURL}/api/session/${session_id}/remove_protocol/`,
      {protocol: protocol_id},
      {responseType: 'json', observe: 'body'}
    );
  }

  deleteProtocolSession(session_id: string) {
    return this.http.delete(
      `${this.baseURL}/api/session/${session_id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getCoturnCredentials() {
    return this.http.get<{username: string, password: string, turn_server: string, turn_port: string}>(
      `${this.baseURL}/api/user/generate_turn_credential/`,
      {responseType: 'json', observe: 'body'}
    );
  }
  getCalendarSessions(start: string, end: string) {
    console.log(start, end)
    return this.http.get<ProtocolSession[]>(
      `${this.baseURL}/api/session/calendar_get_sessions/?start=${start}&end=${end}`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getProtocolEditors(protocol_id: number) {
    return this.http.get<{id: number, username: string}[]>(
      `${this.baseURL}/api/protocol/${protocol_id}/get_editors/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getProtocolViewers(protocol_id: number) {
    return this.http.get<{id: number, username: string}[]>(
      `${this.baseURL}/api/protocol/${protocol_id}/get_viewers/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  protocolAddUserRole(protocol_id: number, username: string, role: string) {
    return this.http.post(
      `${this.baseURL}/api/protocol/${protocol_id}/add_user_role/`,
      {user: username, role: role},
      {responseType: 'json', observe: 'body'}
    );
  }

  protocolRemoveUserRole(protocol_id: number, username: string, role: string) {
    return this.http.post(
      `${this.baseURL}/api/protocol/${protocol_id}/remove_user_role/`,
      {user: username, role: role},
      {responseType: 'json', observe: 'body'}
    );
  }

  getSessionEditors(session_id: string) {
    return this.http.get<{id: number, username: string}[]>(
      `${this.baseURL}/api/session/${session_id}/get_editors/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getSessionViewers(session_id: string) {
    return this.http.get<{id: number, username: string}[]>(
      `${this.baseURL}/api/session/${session_id}/get_viewers/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  sessionAddUserRole(session_id: string, username: string, role: string) {
    return this.http.post(
      `${this.baseURL}/api/session/${session_id}/add_user_role/`,
      {user: username, role: role},
      {responseType: 'json', observe: 'body'}
    );
  }

  sessionRemoveUserRole(session_id: string, username: string, role: string) {
    return this.http.post(
      `${this.baseURL}/api/session/${session_id}/remove_user_role/`,
      {user: username, role: role},
      {responseType: 'json', observe: 'body'}
    );
  }

  deleteProtocol(protocol_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/protocol/${protocol_id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  uploadDataChunk(url: string = "", chunk: File, filename: string, contentRange: string) {
    const form = new FormData()
    form.append('file', chunk)
    form.append('filename', filename)
    let headers = new HttpHeaders()
    headers = headers.append('Content-Range', contentRange)
    //headers.append('Content-Disposition', `attachment; filename=${filename}`)
    console.log(headers)
    if (url !== "") {
      return this.http.put<ChunkUploadResponse>(
        url,
        form,
        {responseType: 'json', observe: 'body', headers: headers}
      )

    } else {
      return this.http.put<ChunkUploadResponse>(
        `${this.baseURL}/api/chunked_upload/`,
        form,
        {responseType: 'json', observe: 'body', headers: headers}
      )

    }
  }

  uploadDataChunkComplete(url: string = "", md5: string, file?: File, filename?: string) {
    const form = new FormData()
    form.append('sha256', md5)
    if (file && filename) {
      form.append('file', file)
      form.append('filename', filename)
      return this.http.post<ChunkUploadResponse>(
        `${this.baseURL}/api/chunked_upload/`,
        form,
        {responseType: 'json', observe: 'body'}
      )
    } else {
      return this.http.post<ChunkUploadResponse>(
        url,
        form,
        {responseType: 'json', observe: 'body'}
      )
    }
  }

  importUserData(uploadID: string) {
    return this.http.post(
      `${this.baseURL}/api/user/import_user_data/`,
      {upload_id: uploadID},
      {responseType: 'json', observe: 'body'}
    )
  }

  searchReagents(search: string) {
    return this.http.get<ReagentQuery>(`${this.baseURL}/api/reagent/?search=${search}`, {responseType: 'json', observe: 'body'})
  }

  stepAddReagent(step_id: number, name: string, quantity: number, unit: string, scalable: boolean = false, scalable_factor: number = 1.0) {
    return this.http.post<ProtocolStepReagent>(
      `${this.baseURL}/api/step/${step_id}/add_protocol_reagent/`,
      {name: name, quantity: quantity, unit: unit, scalable, scalable_factor},
      {responseType: 'json', observe: 'body'}
    )
  }

  stepUpdateReagent(step_id: number, reagent_id: number, quantity: number, scalable: boolean = false, scalable_factor: number = 1.0) {
    return this.http.post<ProtocolStepReagent>(
      `${this.baseURL}/api/step/${step_id}/update_protocol_reagent/`,
      {reagent: reagent_id, quantity: quantity, scalable, scalable_factor},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeReagent(reagent_id: number) {
    return this.http.post(
      `${this.baseURL}/api/step/remove_protocol_reagent/`,
      {reagent: reagent_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  getProtocolReagents(protocol_id: number) {
    return this.http.get<ProtocolReagent[]>(
      `${this.baseURL}/api/protocol/${protocol_id}/get_reagents/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  scratchAnnotation(annotation_id: number) {
    return this.http.post<Annotation>(
      `${this.baseURL}/api/annotation/${annotation_id}/scratch/`,
      {},
      {responseType: 'json', observe: 'body'}
    )
  }

  addProtocolTag(protocol_id: number, tag: string) {
    return this.http.post<ProtocolTag>(
      `${this.baseURL}/api/protocol/${protocol_id}/add_tag/`,
      {tag: tag},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeProtocolTag(protocol_id: number, tag_id: number) {
    return this.http.post(
      `${this.baseURL}/api/protocol/${protocol_id}/remove_tag/`,
      {tag: tag_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  addStepTag(step_id: number, tag: string) {
    return this.http.post<StepTag>(
      `${this.baseURL}/api/step/${step_id}/add_tag/`,
      {tag: tag},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeStepTag(step_id: number, tag_id: number) {
    return this.http.post(
      `${this.baseURL}/api/step/${step_id}/remove_tag/`,
      {tag: tag_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  searchTags(search: string) {
    return this.http.get<TagQuery>(`${this.baseURL}/api/tag/?search=${search}`, {responseType: 'json', observe: 'body'})
  }

  annotationRename(annotation_id: number, name: string) {
    return this.http.post<Annotation>(
      `${this.baseURL}/api/annotation/${annotation_id}/rename/`,
      {annotation_name: name},
      {responseType: 'json', observe: 'body'}
    )
  }

  sessionGetBaseFolders(session_id: string) {
    return this.http.get<AnnotationFolder[]>(
      `${this.baseURL}/api/session/${session_id}/get_base_folders/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  sessionAddFolder(session_id: string, folder_name: string) {
    return this.http.post<AnnotationFolder>(
      `${this.baseURL}/api/session/${session_id}/add_folder/`,
      {folder_name: folder_name},
      {responseType: 'json', observe: 'body'}
    )
  }

  sessionRemoveFolder(session_id: string, folder_id: number, remove_content: boolean = false) {
    if (remove_content) {
      return this.http.post(
        `${this.baseURL}/api/session/${session_id}/remove_folder/`, {folder: folder_id, remove_content: remove_content},
        {responseType: 'json', observe: 'body'}
      )
    }
    return this.http.post(
      `${this.baseURL}/api/session/${session_id}/remove_folder/`, {folder: folder_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  getAnnotationInFolder(folder_id: number, limit: number = 5, offset: number = 0) {
    let params = new HttpParams().set('folder', folder_id.toString())
    params = params.set('limit', limit.toString())
    params = params.set('offset', offset.toString())
    return this.http.get<AnnotationQuery>(
      `${this.baseURL}/api/annotation/get_annotation_in_folder/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  annotationMoveToFolder(annotation_id: number, folder_id: number) {
    return this.http.post(
      `${this.baseURL}/api/annotation/${annotation_id}/move_to_folder/`,
      {folder: folder_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  getFolderChildren(folder_id: number) {
    return this.http.get<AnnotationFolder[]>(
      `${this.baseURL}/api/folder/${folder_id}/get_children/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  transcriptSummarize(annotation_id: number) {
    return this.http.post(
      `${this.baseURL}/api/user/summarize_audio_transcript/`,
      {target: {annotation: annotation_id}},
      {responseType: 'json', observe: 'body'}
    )
  }

  getAnnotation(annotation_id: number) {
    return this.http.get<Annotation>(
      `${this.baseURL}/api/annotation/${annotation_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  cloneProtocol(protocol_id: number, protocol_title: string, protocol_description: string) {
    return this.http.post<Protocol>(
      `${this.baseURL}/api/protocol/${protocol_id}/clone/`,
      {protocol_title: protocol_title, protocol_description: protocol_description},
      {responseType: 'json', observe: 'body'}
    )
  }

  getServerSettings() {
    return this.http.get<{use_ocr: boolean, use_llm: boolean, use_whisper: boolean, use_coturn: boolean, allow_overlap_bookings: boolean, default_service_lab_group: string}>(
      `${this.baseURL}/api/user/get_server_settings/`,
      {responseType: 'json', observe: 'body'}
    )
  }
  bindUploadedFile(session_id: string|undefined|null, upload_id: string, file_name: string, annotation_name: string, step: number = 0, folder: number = 0, instrument_job_id: number|null|undefined = null, instrument_user_type: null|'user_annotation'|'staff_annotation' = null, stored_reagent_id: number|null = null) {
    const payload: any = {upload_id: upload_id, file_name: file_name, annotation_name: annotation_name}
    if (step !== 0) {
      payload['step'] = step
    }
    if (folder !== 0) {
      payload['folder'] = folder
    }
    if (session_id) {
      payload['session'] = session_id
    }
    if (instrument_job_id) {
      payload['instrument_job'] = instrument_job_id
    }
    if (instrument_user_type) {
      payload['instrument_user_type'] = instrument_user_type
    }
    if (stored_reagent_id) {
      payload['stored_reagent'] = stored_reagent_id
    }

    return this.http.post<Annotation>(
      `${this.baseURL}/api/annotation/bind_uploaded_file/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  createProject(project_name: string, project_description: string) {
    return this.http.post<Project>(
      `${this.baseURL}/api/project/`,
      {name: project_name, description: project_description},
      {responseType: 'json', observe: 'body'}
    )
  }

  updateProject(project_id: number, project_name: string, project_description: string) {
    return this.http.put<Project>(
      `${this.baseURL}/api/project/${project_id}/`,
      {name: project_name, description: project_description},
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteProject(project_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/project/${project_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  addSessionToProject(project_id: number, session_id: string) {
    return this.http.post<Project>(
      `${this.baseURL}/api/project/${project_id}/add_session/`,
      {session: session_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeSessionFromProject(project_id: number, session_id: string) {
    return this.http.post(
      `${this.baseURL}/api/project/${project_id}/remove_session/`,
      {session: session_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  getProjects(url?: string, limit: number = 5, offset: number = 0, searchTerm: string = "") {
    if (url) {
      return this.http.get<ProjectQuery>(
        url,
        {responseType: 'json', observe: 'body'}
      );
    }
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())

    if (searchTerm !== "") {
      params = params.append('search', searchTerm);
    }

    return this.http.get<ProjectQuery>(
      `${this.baseURL}/api/project/`,
      {responseType: 'json', observe: 'body', params: params}
    );
  }

  getProject(project_id: number) {
    return this.http.get<Project>(
      `${this.baseURL}/api/project/${project_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getInstrument(instrument_id: number) {
    return this.http.get<Instrument>(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getInstruments(url?: string, limit: number = 5, offset: number = 0, searchTerm: string = "") {
    if (url) {
      return this.http.get<InstrumentQuery>(
        url,
        {responseType: 'json', observe: 'body'}

      )
    }
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (searchTerm !== "") {
      params = params.append('search', searchTerm);
    }
    return this.http.get<InstrumentQuery>(
      `${this.baseURL}/api/instrument/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  createInstrument(instrument_name: string, instrument_description: string) {
    return this.http.post<Instrument>(
      `${this.baseURL}/api/instrument/`,
      {name: instrument_name, description: instrument_description},
      {responseType: 'json', observe: 'body'}
    )
  }

  updateInstrument(instrument_id: number, instrument_name: string, instrument_description: string, max_days_ahead: number|undefined|null, max_duration: number|undefined|null, image: string|undefined|null = undefined) {
    const payload: any = {name: instrument_name, description: instrument_description}
    if (max_days_ahead) {
      payload['max_days_ahead_pre_approval'] = max_days_ahead
    }
    if (max_duration) {
      payload['max_days_within_usage_pre_approval'] = max_duration
    }
    if (image) {
      payload['image'] = image
    }
    return this.http.put<Instrument>(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteInstrument(instrument_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createInstrumentUsageAnnotation(session_id: string|undefined|null, instrument_id: number, time_started: Date|undefined, time_ended: Date|undefined, step_id: number|null = 0, annotation: string, instrument_job_id: number|null|undefined = undefined, instrument_user_type: null|'user_annotation'|'staff_annotation' = null, stored_reagent_id: number|null = null, maintenance: boolean = false, repeat: number = 0, repeatUntil: NgbDateStruct|undefined = undefined) {
    const payload: any = { annotation_type: 'instrument', instrument: instrument_id, time_started: time_started, time_ended: time_ended, annotation: annotation, maintenance}
    if (step_id !== 0) {
      payload['step'] = step_id
    }
    if (session_id) {
      payload['session'] = session_id
    }
    if (instrument_job_id) {
      payload['instrument_job'] = instrument_job_id
    }
    if (instrument_user_type && instrument_user_type === "staff_annotation") {
      payload['instrument_user_type'] = instrument_user_type
    }
    if (stored_reagent_id) {
      payload['stored_reagent'] = stored_reagent_id
    }
    if (repeatUntil) {
      const newDate = new Date(repeatUntil.year, repeatUntil.month - 1, repeatUntil.day)
      payload['repeat_until'] = newDate
    }
    if (repeat) {
      payload['repeat'] = repeat
    }

    return this.http.post<Annotation>(
      `${this.baseURL}/api/annotation/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  getInstrumentUsage(instrument_id: number|number[]|undefined|null, time_started?: Date, time_ended?: Date, users?: string[], limit: number = 50, offset: number = 0, search_type: string = "usage") {
    let params = new HttpParams()
    if (!Array.isArray(instrument_id) && instrument_id !== undefined && instrument_id !== null) {
      params = params.set('instrument', instrument_id.toString())
    } else {
      if (instrument_id) {
        params = params.set('instrument', instrument_id.join(','))
      }
    }
    if (time_started) {
      params = params.set('time_started', time_started.toISOString())
    }
    if (time_ended) {
      params = params.set('time_ended', time_ended.toISOString())
    }
    if (users !== undefined) {
      params = params.set('users', users.join(','))
    }
    if (search_type) {
      params = params.set('search_type', search_type)
    }
    params = params.set('limit', limit.toString())
    params = params.set('offset', offset.toString())

    return this.http.get<InstrumentUsageQuery>(
      `${this.baseURL}/api/instrument_usage/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getStaffStatus() {
    return this.http.get<{is_staff: boolean}>(
      `${this.baseURL}/api/user/is_staff/`,
      {responseType: 'json', observe: 'body'}
    )

  }

  getInstrumentPermission(instrument_id: number) {
    return this.http.get<{can_view: boolean, can_manage: boolean, can_book: boolean}>(
      `${this.baseURL}/api/instrument/${instrument_id}/get_instrument_permission/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createInstrumentUsage(instrument_id: number, time_start: Date, time_end: Date, description: string, maintenance: boolean = false, repeat: number = 0, repeatUntil: NgbDateStruct|undefined = undefined) {
    const data: any = {time_started: time_start, time_ended: time_end, instrument: instrument_id, description: description, maintenance, repeat: repeat}
    if (repeatUntil) {
      const newDate = new Date(repeatUntil.year, repeatUntil.month - 1, repeatUntil.day)
      data['repeat_until'] = newDate
    }
    return this.http.post<InstrumentUsage>(
      `${this.baseURL}/api/instrument_usage/`,
      {time_started: time_start, time_ended: time_end, instrument: instrument_id, description: description, maintenance},
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteInstrumentUsage(usage_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/instrument_usage/${usage_id}/delete_usage/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getUserInstrumentPermission(instrument_id: number, username: string) {
    return this.http.get<{can_view: boolean, can_manage: boolean, can_book: boolean}>(
      `${this.baseURL}/api/instrument/${instrument_id}/get_instrument_permission_for/?user=${username}`,
      {responseType: 'json', observe: 'body'}
    )
  }

  assignInstrumentPermission(instrument_id: number, username: string, permissions: any) {
    return this.http.post(
      `${this.baseURL}/api/instrument/${instrument_id}/assign_instrument_permission/`,
      {user: username, can_view: permissions.can_view, can_manage: permissions.can_manage, can_book: permissions.can_book},
      {responseType: 'json', observe: 'body'}
    )
  }

  getStorageObjects(url?: string, limit: number = 10, offset: number = 0, searchTerm: string = "", root: boolean = false, stored_at: number|null = null) {
    if (url) {
      return this.http.get<StorageObjectQuery>(
        url,
        {responseType: 'json', observe: 'body'}
      );
    }
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (searchTerm !== "") {
      params = params.append('search', searchTerm);
    }
    if (root) {
      params = params.append('root', 'true')
    }
    if (stored_at) {
      params = params.append('stored_at', stored_at.toString())
    }

    return this.http.get<StorageObjectQuery>(
      `${this.baseURL}/api/storage_object/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getStorageObjectsByLabGroup(lab_group_id: number, limit: number = 10, offset: number = 0, searchTerm: string|undefined|null = "") {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (searchTerm !== "" && searchTerm) {
      params = params.append('search', searchTerm);
    }
    params = params.append('lab_group', lab_group_id.toString())
    return this.http.get<StorageObjectQuery>(
      `${this.baseURL}/api/storage_object/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getStorageObject(object_id: number) {
    return this.http.get<StorageObject>(
      `${this.baseURL}/api/storage_object/${object_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createStorageObject(object_name: string, object_description: string, object_type: string, stored_at: number|null) {
    return this.http.post<StorageObject>(
      `${this.baseURL}/api/storage_object/`,
      {name: object_name, description: object_description, object_type: object_type, stored_at: stored_at},
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteStorageObject(object_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/storage_object/${object_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  updateStorageObject(object_id: number, object_name: string, object_description: string, png_base64: string|null = null) {
    const payload: any = {name: object_name, description: object_description, png_base64: png_base64}

    return this.http.put<StorageObject>(
      `${this.baseURL}/api/storage_object/${object_id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  getStoredReagents(url?: string, limit: number = 10, offset: number = 0, searchTerm: string = "", storage_object: number|null = null, storage_object_name: string|null = null, user_owned_only: boolean= false, stored_reagent_id: number|null|undefined = null) {
    if (url) {
      return this.http.get<StoredReagentQuery>(
        url,
        {responseType: 'json', observe: 'body'}
      );
    }
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())

    if (user_owned_only) {
      params = params.append('user_only', 'true')
    }
    if (storage_object_name) {
      params = params.append('storage_object_name', storage_object_name)
    }

    if (searchTerm !== "") {
      params = params.append('search', searchTerm);
    }

    if (storage_object) {
      params = params.append('storage_object', storage_object.toString())
    }

    if (stored_reagent_id) {
      params = params.append('id', stored_reagent_id.toString())
    }

    return this.http.get<StoredReagentQuery>(
      `${this.baseURL}/api/stored_reagent/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getStoredReagent(reagent_id: number) {
    return this.http.get<StoredReagent>(
      `${this.baseURL}/api/stored_reagent/${reagent_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }


  updateStoredReagent(reagent_id: number, quantity: number, notes: string, png_base64: string|null = null, barcode: string|null = null, shareable: boolean = true, expiration_date: NgbDateStruct|null = null, created_by_project: number|null = null, created_by_protocol: number|null = null, created_by_session: number|null = null, created_by_step: number|null = null) {
    const payload: any = {quantity: quantity, notes: notes, png_base64: png_base64, barcode: barcode, shareable: shareable}
    if (expiration_date) {
      payload['expiration_date'] = `${expiration_date.year}-${expiration_date.month}-${expiration_date.day}`
    }
    if (created_by_project) {
      payload['created_by_project'] = created_by_project
    }
    if (created_by_protocol) {
      payload['created_by_protocol'] = created_by_protocol
    }
    if (created_by_session) {
      payload['created_by_session'] = created_by_session
    }
    if (created_by_step) {
      payload['created_by_step'] = created_by_step
    }
    return this.http.put<StoredReagent>(
      `${this.baseURL}/api/stored_reagent/${reagent_id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteStoredReagent(reagent_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/stored_reagent/${reagent_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getStorageObjectPathToRoot(object_id: number) {
    return this.http.get<{id: number, name: string}[]>(
      `${this.baseURL}/api/storage_object/${object_id}/get_path_to_root/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createStoredReagent(storage_object: number, name: string, unit: string, quantity: number, notes: string, barcode: string|null = null, shareable: boolean = true, access_all: boolean = false, created_by_project: number|null = null, created_by_protocol: number|null = null, created_by_session: number|null = null, created_by_step: number|null = null) {
    const payload: any = {storage_object: storage_object, name: name, unit: unit, quantity: quantity, notes: notes, shareable: shareable, access_all: access_all}
    if (barcode) {
      payload['barcode'] = barcode
    }
    if (created_by_project) {
      payload['created_by_project'] = created_by_project
    }
    if (created_by_protocol) {
      payload['created_by_protocol'] = created_by_protocol
    }
    if (created_by_session) {
      payload['created_by_session'] = created_by_session
    }
    if (created_by_step) {
      payload['created_by_step'] = created_by_step
    }
    return this.http.post<StoredReagent>(
      `${this.baseURL}/api/stored_reagent/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  createStoredReagentAction(stored_reagent_id: number, action_type: string, quantity: number, notes: string = "", step_reagent: number|null = null, session: string|null = null) {
    const payload: any = {action_type: action_type, quantity: quantity, reagent: stored_reagent_id, notes: notes}
    if (step_reagent) {
      payload['step_reagent'] = step_reagent
    }
    if (session) {
      payload['session'] = session
    }

    return this.http.post<ReagentAction>(
      `${this.baseURL}/api/reagent_action/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  getStoredReagentActions(reagent_id?: number, limit: number = 10, offset: number = 0) {
    let params = new HttpParams()
    if (reagent_id) {
      params = params.set('reagent', reagent_id.toString())
    }
    params = params.set('limit', limit.toString())
      .set('offset', offset.toString()).set('ordering', '-created_at')
    return this.http.get<ReagentActionQuery>(
      `${this.baseURL}/api/reagent_action/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getStoredReagentActionWithinRange(reagent_id: number, start: Date, end: Date) {
    let params = new HttpParams()
    params = params.set('reagent', reagent_id.toString())
      .set('start_date', start.toISOString())
      .set('end_date', end.toISOString())
    return this.http.get<ReagentAction[]>(
      `${this.baseURL}/api/reagent_action/get_reagent_action_range/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  deleteReagentAction(action_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/reagent_action/${action_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getStepAssociatedReagentActions(step_id: number, session_id: string) {
    return this.http.get<ReagentAction[]>(
      `${this.baseURL}/api/step/${step_id}/get_associated_reagent_actions/`,
      {responseType: 'json', observe: 'body', params: new HttpParams().set('session', session_id)}
    )
  }

  createMetaDataColumn(parent_id: number, metadataColumn?: any, parent_type: "instrument"|"stored_reagent"|"annotation" = "stored_reagent") {
    const payload: any = {parent_id: parent_id, parent_type: parent_type}

    if (metadataColumn) {
      payload["name"] = metadataColumn.name
      payload["type"] = metadataColumn.type
      payload["value"] = metadataColumn.value
    }
    if (payload["name"] === "Modification parameters") {
      if (metadataColumn.metadataMM) {
        payload["value"] += `;MM=${metadataColumn.metadataMM}`
      }
      if (metadataColumn.metadataPP) {
        payload["value"] += `;PP=${metadataColumn.metadataPP}`
      }
      if (metadataColumn.metadataTA) {
        payload["value"] += `;TA=${metadataColumn.metadataTA}`
      }
      if (metadataColumn.metadataTS) {
        payload["value"] += `;TS=${metadataColumn.metadataTS}`
      }
      if (metadataColumn.metadataMT) {
        payload["value"] += `;MT=${metadataColumn.metadataMT}`
      }
    }

    console.log(payload)
    return this.http.post<MetadataColumn>(
      `${this.baseURL}/api/metadata_columns/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  updateMetaDataColumn(id: number, name?: string, type?: string, value?: string, not_applicable?: boolean) {
    const payload: any = {}
    if (name) {
      payload["name"] = name
    }
    if (value) {
      payload["value"] = value
    }
    if (type) {
      payload["type"] = type
    }
    if (not_applicable !== undefined) {
      payload["not_applicable"] = not_applicable
    }
    return this.http.put<MetadataColumn>(
      `${this.baseURL}/api/metadata_columns/${id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteMetaDataColumn(id: number) {
    return this.http.delete(
      `${this.baseURL}/api/metadata_columns/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createLabGroup(name: string, description: string, is_professional: boolean = false) {
    return this.http.post<any>(
      `${this.baseURL}/api/lab_groups/`,
      {name: name, description: description, is_professional: is_professional},
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteLabGroup(id: number) {
    return this.http.delete(
      `${this.baseURL}/api/lab_groups/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  addLabGroupMember(lab_group_id: number, member_id: number) {
    return this.http.post<LabGroup>(
      `${this.baseURL}/api/lab_groups/${lab_group_id}/add_user/`,
      {user: member_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeLabGroupMember(lab_group_id: number, member_id: number) {
    return this.http.post(
      `${this.baseURL}/api/lab_groups/${lab_group_id}/remove_user/`,
      {user: member_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  getSpecies(url?: string, limit: number = 10, offset: number = 0, search?: string, search_type: string = "startswith", official_name: string|null|undefined = null, taxon_id: string|null|undefined = null) {
    if (url) {
      return this.http.get<SpeciesQuery>(url, {responseType: 'json', observe: 'body'})
    }
    let params = new HttpParams()
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (search && search !== "") {
      params = params.append('search', `'${search}'`)
    }
    if (search_type) {
      params = params.append('search_type', search_type)
    }
    if (official_name) {
      params = params.append('official_name', official_name)
    }
    if (taxon_id) {
      params = params.append('taxon', taxon_id)
    }
    params = params.append('ordering', 'official_name')
    return this.http.get<SpeciesQuery>(
      `${this.baseURL}/api/species/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getSpeciesByID(id: number) {
    return this.http.get<Species>(
      `${this.baseURL}/api/species/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getTissues(url?: string, limit: number = 10, offset: number = 0, search?: string, search_type: string = "startswith", identifier: string|null|undefined = null, accession: string|null|undefined = null) {
    if (url) {
      return this.http.get<TissueQuery>(url, {responseType: 'json', observe: 'body'})
    }
    let params = new HttpParams()
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (search && search !== "") {
      params = params.append('search', `'${search}'`)
    }
    if (search_type) {
      params = params.append('search_type', search_type)
    }
    if (identifier) {
      params = params.append('identifier', identifier)
    }
    params = params.append('ordering', 'identifier')
    return this.http.get<TissueQuery>(
      `${this.baseURL}/api/tissues/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getTissueByID(id: number) {
    return this.http.get<Tissue>(
      `${this.baseURL}/api/tissues/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getSubcellularLocations(url?: string, limit: number = 10, offset: number = 0, search?: string, search_type: string = "startswith", location_identifier: string|null|undefined = null, accession: string|null|undefined = null) {
    if (url) {
      return this.http.get<SubcellularLocationQuery>(url, {responseType: 'json', observe: 'body'})
    }
    let params = new HttpParams()
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (search && search !== "") {
      params = params.append('search', `'${search}'`)
    }
    if (search_type) {
      params = params.append('search_type', search_type)
    }
    if (location_identifier) {
      params = params.append('location_identifier', location_identifier)
    }
    if (accession) {
      params = params.append('accession', accession)
    }
    params = params.append('ordering', 'identifier')
    return this.http.get<SubcellularLocationQuery>(
      `${this.baseURL}/api/subcellular_locations/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getSubcellularLocationByID(id: number) {
    return this.http.get<SubcellularLocation>(
      `${this.baseURL}/api/subcellular_locations/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getHumandDiseases(url?: string, limit: number = 10, offset: number = 0, search?: string, search_type: string = "startswith") {
    if (url) {
      return this.http.get<HumanDiseaseQuery>(url, {responseType: 'json', observe: 'body'})
    }
    let params = new HttpParams()
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (search && search !== "") {
      params = params.append('search', `'${search}'`)
    }
    if (search_type) {
      params = params.append('search_type', search_type)
    }
    params = params.append('ordering', 'identifier')
    return this.http.get<HumanDiseaseQuery>(
      `${this.baseURL}/api/human_diseases/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getMSVocab(url?: string, limit: number = 10, offset: number = 0, search?: string, term_type?: string, search_type: string = "startswith", name: string|null|undefined = null, accession: string|null|undefined = null) {
    if (url) {
      return this.http.get<MsVocabQuery>(url, {responseType: 'json', observe: 'body'})
    }
    let params = new HttpParams()
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (search && search !== "") {
      params = params.append('search', `'${search}'`)
    }
    if (term_type && term_type !== "") {
      if (term_type === "cleavage agent details") {
        term_type = "cleavage agent"
      }
      params = params.append('term_type', term_type)
    }
    if (search_type) {
      params = params.append('search_type', search_type)
    }
    if (name) {
      params = params.append('name', name)
    }
    if (accession) {
      params = params.append('accession', accession)
    }
    params = params.append('ordering', 'name')
    return this.http.get<MsVocabQuery>(
      `${this.baseURL}/api/ms_vocab/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getLabGroups(search_term: string = "", limit: number = 10, offset: number = 0, is_professional: boolean|undefined = undefined) {
    let params = new HttpParams()
    if (search_term && search_term !== "") {
      params = params.append('search', search_term)
    }
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (is_professional) {
      params = params.append('is_professional', is_professional.toString())
    }
    return this.http.get<LabGroupQuery>(
      `${this.baseURL}/api/lab_groups/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  updateLabGroup(lab_group_id: number, name: string, description: string, default_storage: number|null = null, service_storage: number|null = null, is_professional: undefined|boolean = undefined) {
    const payload: any = {name: name, description: description}
    if (default_storage) {
      payload['default_storage'] = default_storage
    }

    if (service_storage) {
      payload['service_storage'] = service_storage
    }

    if (is_professional !== undefined) {
      payload['is_professional'] = is_professional
    }
    return this.http.put<LabGroup>(
      `${this.baseURL}/api/lab_groups/${lab_group_id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  checkStoredReagentPermission(reagent_ids: number[]) {
    return this.http.post<{permission: {edit: boolean, view: boolean, delete: boolean}, "stored_reagent": number}[]>(
      `${this.baseURL}/api/user/check_stored_reagent_permission/`,
      {stored_reagents: reagent_ids},
      {responseType: 'json', observe: 'body'}
    )
  }

  getUsers(url?: string, limit: number = 10, offset: number = 0, search?: string|undefined|null) {
    if (url) {
      return this.http.get<UserQuery>(url, {responseType: 'json', observe: 'body'})
    }
    let params = new HttpParams()
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (search && search !== "") {
      params = params.append('search', `'${search}'`)
    }
    return this.http.get<UserQuery>(
      `${this.baseURL}/api/user/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getUsersByLabGroup(lab_group_id: number, limit: number = 10, offset: number = 0, searchTerm: string|undefined|null = "") {
    let params = new HttpParams()
    params = params.append('lab_group', lab_group_id.toString())
    params = params.append('limit', limit.toString())
    params = params.append('offset', offset.toString())
    if (searchTerm !== "" && searchTerm !== undefined && searchTerm !== null) {
      params = params.append('search', searchTerm);
    }
    return this.http.get<UserQuery>(
      `${this.baseURL}/api/user/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getUsersByStoredReagent(stored_reagent_id: number, limit: number = 10, offset: number = 0) {
    let params = new HttpParams()
    params = params.append('stored_reagent', stored_reagent_id.toString())
    params = params.append('limit', limit.toString())
    params = params.append('offset', offset.toString())
    return this.http.get<UserQuery>(
      `${this.baseURL}/api/user/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getLabGroupsByStoredReagent(stored_reagent_id: number, limit: number = 10, offset: number = 0) {
    let params = new HttpParams()
    params = params.append('stored_reagent', stored_reagent_id.toString())
    params = params.append('limit', limit.toString())
    params = params.append('offset', offset.toString())
    return this.http.get<LabGroupQuery>(
      `${this.baseURL}/api/lab_groups/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getLabGroupsByStorageObject(storage_object_id: number, limit: number = 10, offset: number = 0, searchTerm: string|undefined|null = "") {
    let params = new HttpParams()
    params = params.append('storage_object', storage_object_id.toString())
    params = params.append('limit', limit.toString())
    params = params.append('offset', offset.toString())
    if (searchTerm !== "" && searchTerm !== undefined && searchTerm !== null) {
      params = params.append('search', searchTerm);
    }
    return this.http.get<LabGroupQuery>(
      `${this.baseURL}/api/lab_groups/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getUser(id: number) {
    return this.http.get<User>(
      `${this.baseURL}/api/user/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  addAccessUserToStoredReagent(stored_reagent_id: number, username: string) {
    return this.http.post<User>(
      `${this.baseURL}/api/stored_reagent/${stored_reagent_id}/add_access_user/`,
      {user: username},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeAccessUserFromStoredReagent(stored_reagent_id: number, username: string) {
    return this.http.post<User>(
      `${this.baseURL}/api/stored_reagent/${stored_reagent_id}/remove_access_user/`,
      {user: username},
      {responseType: 'json', observe: 'body'}
    )
  }

  addAccessGroupToStoredReagent(stored_reagent_id: number, lab_group_id: number) {
    return this.http.post(
      `${this.baseURL}/api/stored_reagent/${stored_reagent_id}/add_access_group/`,
      {lab_group: lab_group_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeAccessGroupFromStoredReagent(stored_reagent_id: number, lab_group_id: number) {
    return this.http.post(
      `${this.baseURL}/api/stored_reagent/${stored_reagent_id}/remove_access_group/`,
      {lab_group: lab_group_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  getUnimod(url?: string, limit: number = 10, offset: number = 0, search?: string, search_type: string = "startswith", name: string|null|undefined = null, accession: string|null|undefined = null) {
    if (url) {
      return this.http.get<UnimodQuery>(url, {responseType: 'json', observe: 'body'})
    }
    let params = new HttpParams()
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (search && search !== "") {
      params = params.append('search', `'${search}'`)
    }
    if (search_type) {
      params = params.append('search_type', search_type)
    }
    if (name) {
      params = params.append('name', name)
    }
    if (accession) {
      params = params.append('accession', accession)
    }
    params = params.append('ordering', 'name')
    return this.http.get<UnimodQuery>(
      `${this.baseURL}/api/unimod/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  stepExportMetadata(step: number, session: string) {
    return this.http.get<{
      column_position: number, name: string, type: string, value: string|null, not_applicable: boolean
    }[]>(
      `${this.baseURL}/api/step/${step}/export_associated_metadata/`,
      {responseType: 'json', observe: 'body', params: new HttpParams().set('session', session)}
    )
  }

  convertMetadataToSDRFTxt(step_id: number, data: any[]) {
    return this.http.post<any>(`${this.baseURL}/api/step/${step_id}/convert_metadata_to_sdrf_txt/`, data, {responseType: 'json', observe: 'body'})
  }

  getInstrumentJobs(limit: number = 10, offset: number = 0, search: string = "", mode: "string"|undefined|null = undefined, lab_group: number|null|undefined = 0, status: "string"|undefined|null = undefined, funder: "string"|undefined|null = undefined, cost_center: "string"|undefined|null = undefined, search_engine: "string"|undefined|null = undefined, search_engine_version: "string"|undefined|null = undefined) {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())

    if (search !== "") {
      params = params.append('search', search);
    }
    if (mode) {
      params = params.append('mode', mode)
    }

    if (status) {
      params = params.append('status', status)
    }

    if (lab_group) {
      if (lab_group > 0) {
        params = params.append('lab_group', lab_group.toString())
      }
    }

    if (funder) {
      params = params.append('funder', funder)
    }

    if (cost_center) {
      params = params.append('cost_center', cost_center)
    }

    if (search_engine) {
      params = params.append('search_engine', search_engine)
    }

    if (search_engine_version) {
      params = params.append('search_engine_version', search_engine_version)
    }

    return this.http.get<InstrumentJobQuery>(
      `${this.baseURL}/api/instrument_jobs/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getInstrumentJob(job_id: number) {
    return this.http.get<InstrumentJob>(
      `${this.baseURL}/api/instrument_jobs/${job_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createInstrumentJob(job_name: string, project: number) {
    return this.http.post<InstrumentJob>(
      `${this.baseURL}/api/instrument_jobs/`,
      {job_name: job_name, project: project},
      {responseType: 'json', observe: 'body'}
    )
  }
  updateInstrumentJob(
    job_id: number,
    payload: any
  ) {
    return this.http.put<InstrumentJob>(
      `${this.baseURL}/api/instrument_jobs/${job_id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  addLabGroupToStorageObject(storage_object_id: number, lab_group_id: number) {
    return this.http.post(
      `${this.baseURL}/api/storage_object/${storage_object_id}/add_access_group/`,
      {lab_group: lab_group_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  removeLabGroupFromStorageObject(storage_object_id: number, lab_group_id: number) {
    return this.http.post(
      `${this.baseURL}/api/storage_object/${storage_object_id}/remove_access_group/`,
      {lab_group: lab_group_id},
      {responseType: 'json', observe: 'body'}
    )
  }

  getUserLabGroups(search_term: string = "", limit: number = 10, offset: number = 0, is_professional: boolean|undefined = undefined) {
    let params = new HttpParams()
    if (search_term && search_term !== "") {
      params = params.append('search', search_term)
    }
    if (limit) {
      params = params.append('limit', limit.toString())
    }
    if (offset) {
      params = params.append('offset', offset.toString())
    }
    if (is_professional) {
      params = params.append('is_professional', is_professional.toString())
    }
    return this.http.get<LabGroupQuery>(
      `${this.baseURL}/api/user/get_user_lab_groups/`,
      {responseType: 'json', observe: 'body', params}
    )
  }

  getLabGroup(id: number) {
    return this.http.get<LabGroup>(
      `${this.baseURL}/api/lab_groups/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  checkUserInLabGroup(lab_group_id: number) {
    return this.http.post<any>(
      `${this.baseURL}/api/user/check_user_in_lab_group/`,
      {lab_group: lab_group_id},
      {responseType: 'json', observe: 'response'}
    )
  }

  instrumentJobUpdateStaffData(job_id: number, payload: any) {
    return this.http.post<InstrumentJob>(
      `${this.baseURL}/api/instrument_jobs/${job_id}/update_staff_data/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  generateSignupToken(email: string, lab_group: number|null) {
    return this.http.post<{token: string}>(
      `${this.baseURL}/api/user/generate_signup_token/`,
      {email: email, lab_group: lab_group},
      {responseType: 'json', observe: 'body'}
    )
  }

  generateSignupTokenAndSendEmail(email: string, lab_group: number|null) {
    return this.http.post<{token: string}>(
      `${this.baseURL}/api/user/generate_signup_token_and_send_email/`,
      {email: email, lab_group: lab_group},
      {responseType: 'json', observe: 'body'}
    )
  }

  instrumentJobSubmit(job_id: number) {
    return this.http.post<InstrumentJob>(
      `${this.baseURL}/api/instrument_jobs/${job_id}/submit_job/`,
      {},
      {responseType: 'json', observe: 'body'}
    )
  }

  instrumentJobIndividualFieldTypeAhead(field_name: string, search: string) {
    return this.http.get<{results: string[]}>(
      `${this.baseURL}/api/instrument_jobs/individual_field_typeahead/`,
      {responseType: 'json', observe: 'body', params: new HttpParams().set('field_name', field_name).set('search', search)}
    )
  }

  instrumentJobUpdateStatus(job_id: number, status: string) {
    return this.http.post<InstrumentJob>(
      `${this.baseURL}/api/instrument_jobs/${job_id}/update_status/`,
      {status: status},
      {responseType: 'json', observe: 'body'}
    )
  }

  instrumentJobExportMetadata(job_id: number, session: string, data_type: string) {
    const payload = {instance_id: session, data_type}
    return this.http.post(`${this.baseURL}/api/instrument_jobs/${job_id}/export_metadata_to_tsv/`, payload, {responseType: 'json', observe: 'body'})
  }

  instrumentJobImportSDRFMetadata(instrument_job_id: number, annotation_id: number, instance_id: string, data_type: string) {
    const payload = {annotation: annotation_id, instance_id, data_type}
    return this.http.post(`${this.baseURL}/api/instrument_jobs/${instrument_job_id}/import_sdrf_metadata/`, payload, {responseType: 'json', observe: 'body'})
  }

  getCSRFToken() {
    return this.http.get(`${this.baseURL}/api/set-csrf/`, { observe: 'response'})
  }

  getCSRFTokenFromCookies(): string | null {
    const cookies = document.cookie.split(';');
    const csrf = cookies.find((cookie) => cookie.trim().startsWith('csrfToken='));
    if (csrf) {
      return csrf.split('=')[1];
    }
    return null;
  }

  getFavouriteMetadataOptions(limit: number = 10, offset: number = 0, search: string|null = "", mode: string|undefined|null = undefined, lab_group: number|null|undefined = 0, name: string|undefined|null = null, display_value: string|undefined|null = null, get_global: boolean = false) {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (search !== "" && search !== null) {
      params = params.append('search', search);
    }
    if (mode) {
      params = params.append('mode', mode)
    }
    if (lab_group) {
      if (lab_group > 0) {
        params = params.append('lab_group_id', lab_group.toString())
      }
    }
    if (name) {
      params = params.append('name', name)
    }
    if (display_value) {
      params = params.append('display_value', display_value)
    }
    if (get_global) {
      params = params.append('get_global', 'true')
    }

    return this.http.get<FavouriteMetadataOptionQuery>(
      `${this.baseURL}/api/favourite_metadata_option/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getFavouriteMetadataOption(id: number) {
    return this.http.get<FavouriteMetadataOption>(
      `${this.baseURL}/api/favourite_metadata_option/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createFavouriteMetadataOption(payload: any) {
    return this.http.post<FavouriteMetadataOption>(
      `${this.baseURL}/api/favourite_metadata_option/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteFavouriteMetadataOption(id: number) {
    return this.http.delete(
      `${this.baseURL}/api/favourite_metadata_option/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  updateFavouriteMetadataOption(id: number, payload: any) {
    return this.http.put<FavouriteMetadataOption>(
      `${this.baseURL}/api/favourite_metadata_option/${id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  getPresets(limit: number = 10, offset: number = 0, search: string|null = "") {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (search !== "" && search !== null) {
      params = params.append('search', search);
    }

    return this.http.get<PresetQuery>(
      `${this.baseURL}/api/preset/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getPreset(id: number) {
    return this.http.get<Preset>(
      `${this.baseURL}/api/preset/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createPreset(payload: any) {
    return this.http.post<Preset>(
      `${this.baseURL}/api/preset/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  updatePreset(id: number, payload: any) {
    return this.http.put<Preset>(
      `${this.baseURL}/api/preset/${id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  deletePreset(id: number) {
    return this.http.delete(
      `${this.baseURL}/api/preset/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  validateSDRFMetadata(instrument_job_id: number, instance_id:string) {
    return this.http.post(`${this.baseURL}/api/instrument_jobs/${instrument_job_id}/validate_sdrf_metadata/`, {instance_id}, {responseType: 'json', observe: 'body'})
  }

  exportExcelTemplate(instrument_job_id: number, instance_id: string, export_type: "user_metadata"|"staff_metadata"|"all") {
    return this.http.post(`${this.baseURL}/api/instrument_jobs/${instrument_job_id}/export_excel_template/`, {instance_id, export_type}, {responseType: 'json', observe: 'body'})
  }

  getMetadataTableTemplates(limit: number = 10, offset: number = 0, search: string|null = "", mode: string|undefined|null = 'user', lab_group_id: number|null|undefined = 0, self_only: boolean = true) {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (search !== "" && search !== null) {
      params = params.append('search', search);
    }
    if (mode) {
      params = params.append('mode', mode)
    }

    if (lab_group_id && mode === 'service_lab_group') {
      if (lab_group_id > 0) {
        params = params.append('lab_group_id', lab_group_id.toString())
      }
    }

    if (self_only) {
      params = params.append('self_only', 'true')
    } else {
      params = params.append('self_only', 'false')
    }

    return this.http.get<MetadataTableTemplateQuery>(
      `${this.baseURL}/api/metadata_table_templates/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  getMetadataTableTemplate(id: number) {
    return this.http.get<MetadataTableTemplate>(
      `${this.baseURL}/api/metadata_table_templates/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  updateMetadataTableTemplate(id: number, payload: any) {
    return this.http.put<MetadataTableTemplate>(
      `${this.baseURL}/api/metadata_table_templates/${id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteMetadataTableTemplate(id: number) {
    return this.http.delete(
      `${this.baseURL}/api/metadata_table_templates/${id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createMetadataTableTemplate(payload: any) {
    return this.http.post<MetadataTableTemplate>(
      `${this.baseURL}/api/metadata_table_templates/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  instrumentJobSelectedTemplate(instrument_job_id: number, template_id: number) {
    return this.http.post<InstrumentJob>(`${this.baseURL}/api/instrument_jobs/${instrument_job_id}/selected_template/`, {template: template_id}, {responseType: 'json', observe: 'body'})
  }

  instrumentJobRemoveSelectedTemplate(instrument_job_id: number) {
    return this.http.post<InstrumentJob>(`${this.baseURL}/api/instrument_jobs/${instrument_job_id}/remove_selected_template/`, {}, {responseType: 'json', observe: 'body'})
  }

  instrumentDelayUsage(instrument_job_id: number, days: number, start_date: Date|undefined|null) {
    if (!start_date) {
      start_date = new Date()
    }
    return this.http.post<Instrument>(`${this.baseURL}/api/instrument/${instrument_job_id}/delay_usage/`, {days, start_date}, {responseType: 'json', observe: 'body'})
  }

  instrumentUsageDelayUsage(instrument_usage_id: number, days: number) {
    return this.http.post<InstrumentUsage>(`${this.baseURL}/api/instrument_usage/${instrument_usage_id}/delay_usage/`, {days}, {responseType: 'json', observe: 'body'})
  }

  copyMetadataToProtocol(protocol_id: number, metadata: any[]) {
    return this.http.post<Protocol>(`${this.baseURL}/api/protocol/${protocol_id}/add_metadata_columns/`, {metadata_columns: metadata}, {responseType: 'json', observe: 'body'})
  }

  instrumentJobCopyMetadataFromProtocol(instrument_job_id: number, metadata_ids: number[]) {
    return this.http.post<InstrumentJob>(`${this.baseURL}/api/instrument_jobs/${instrument_job_id}/copy_metadata_from_protocol/`, {metadata_ids}, {responseType: 'json', observe: 'body'})
  }

  exportUsage(instruments: number[], time_started: Date, time_ended: Date, lab_group: number[] = [], user: number[] = [], mode: string = "user", calculate_with_duration_cutoff: boolean = false, instance_id: string = "", file_format: string = "xlsx") {
    return this.http.post(`${this.baseURL}/api/instrument_usage/export_usage/`, {instruments, time_started, time_ended, lab_group, user, mode, calculate_with_duration_cutoff, instance_id, file_format}, {responseType: 'json', observe: 'body'})
  }

  approveUsageToggle(instrument_usage_id: number) {
    return this.http.post<InstrumentUsage>(`${this.baseURL}/api/instrument_usage/${instrument_usage_id}/approve_usage_toggle/`, {}, {responseType: 'json', observe: 'body'})
  }

  validateMetadataTemplateSDRF(data: string[][]) {
    return this.http.post<{errors: string[]}>(`${this.baseURL}/api/metadata_table_templates/validate_sdrf_metadata/`, {sdrf: data}, {responseType: 'json', observe: 'body'})
  }
}

interface ChunkUploadResponse {
  id: string,
  url: string,
  file: string,
  filename: string,
  offset: number,
  created_at: Date,
  status: number,
  completed_at: Date|null,
  user: number,
}

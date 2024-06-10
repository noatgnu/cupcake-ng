import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
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


@Injectable({
  providedIn: 'root'
})
export class WebService {
  cupcakeInstanceID: string = crypto.randomUUID()
  baseURL: string = environment.baseURL;
  reagentActionDeleteExpireMinutes: number = 120

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

  saveAnnotationText(session_id: string, step_id: number = 0, text: string) {
    const form = new FormData();
    form.append('annotation', text);
    form.append('annotation_type', 'text');
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    form.append('session', session_id);
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

  saveAnnotationFile(session_id: string, step_id: number = 0, file: File, annotation_type: string = 'file') {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', annotation_type);
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    form.append('session', session_id);
    form.append('file', file);
    console.log(session_id, step_id, file)
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveSketch(session_id: string, step_id: number = 0, strokes: any[]) {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', 'sketch');
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    form.append('session', session_id);
    const file = new File([JSON.stringify(strokes)], 'sketch.json', {type: 'application/json'});
    form.append('file', file);
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveAnnotationJSON(session_id: string, step_id: number = 0, json: any, annotation_type: string ) {
    const form = new FormData()
    form.append('annotation', JSON.stringify(json));
    form.append('annotation_type', annotation_type);
    if (step_id !== 0) {
      form.append('step', step_id.toString());
    }
    form.append('session', session_id);
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

  saveMediaRecorderBlob(session_id: string, step_id: number, blob: Blob, annotation_type: string) {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', annotation_type);
    form.append('step', step_id.toString());
    form.append('session', session_id);
    let file: File
    if (annotation_type === 'audio') {
      file = new File([blob], `recording${annotation_type}.webm`, {type: 'audio/webm'});
    } else {
      file = new File([blob], `recording${annotation_type}.webm`, {type: 'video/webm'});
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

  updateProtocol(protocol_id: number, protocol_title: string, protocol_description: string, enabled: boolean) {
    return this.http.put<Protocol>(
      `${this.baseURL}/api/protocol/${protocol_id}/`,
      {protocol_title: protocol_title, protocol_description: protocol_description, enabled: enabled},
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

  getAnnotationInFolder(folder_id: number) {
    let params = new HttpParams().set('folder', folder_id.toString())
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
    return this.http.get<{use_ocr: boolean, use_llm: boolean, use_whisper: boolean, use_coturn: boolean}>(
      `${this.baseURL}/api/user/get_server_settings/`,
      {responseType: 'json', observe: 'body'}
    )
  }
  bindUploadedFile(session_id: string, upload_id: string, file_name: string, annotation_name: string, step: number = 0, folder: number = 0) {
    return this.http.post(
      `${this.baseURL}/api/annotation/bind_uploaded_file/`,
      {session: session_id, upload_id: upload_id, file_name: file_name, annotation_name: annotation_name, step: step, folder: folder},
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

  updateInstrument(instrument_id: number, instrument_name: string, instrument_description: string) {
    return this.http.put<Instrument>(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      {name: instrument_name, description: instrument_description},
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteInstrument(instrument_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  createInstrumentUsageAnnotation(session_id: string, instrument_id: number, time_started: Date|undefined, time_ended: Date|undefined, step_id: number = 0, annotation: string) {
    const payload: any = {session: session_id, annotation_type: 'instrument', instrument: instrument_id, time_started: time_started, time_ended: time_ended, annotation: annotation}
    if (step_id !== 0) {
      payload['step'] = step_id
    }
    return this.http.post<Annotation>(
      `${this.baseURL}/api/annotation/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  getInstrumentUsage(instrument_id: number, time_started?: Date, time_ended?: Date) {
    let params = new HttpParams()
    params = params.set('instrument', instrument_id.toString())
    if (time_started) {
      params = params.set('time_started', time_started.toISOString())
    }
    if (time_ended) {
      params = params.set('time_ended', time_ended.toISOString())
    }

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

  createInstrumentUsage(instrument_id: number, time_start: Date, time_end: Date, description: string) {
    return this.http.post<InstrumentUsage>(
      `${this.baseURL}/api/instrument_usage/`,
      {time_started: time_start, time_ended: time_end, instrument: instrument_id, description: description},
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

  getStoredReagents(url?: string, limit: number = 10, offset: number = 0, searchTerm: string = "", storage_object: number|null = null, storage_object_name: string|null = null, user_owned_only: boolean= false) {
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
      params = params.append('user_owned_only', 'true')
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


  updateStoredReagent(reagent_id: number, quantity: number, notes: string, png_base64: string|null = null, barcode: string|null = null, shareable: boolean = true) {
    const payload: any = {quantity: quantity, notes: notes, png_base64: png_base64, barcode: barcode, shareable: shareable}

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

  createStoredReagent(storage_object: number, name: string, unit: string, quantity: number, notes: string, barcode: string|null = null, shareable: boolean = true) {
    const payload: any = {storage_object: storage_object, name: name, unit: unit, quantity: quantity, notes: notes, shareable: shareable}
    if (barcode) {
      payload['barcode'] = barcode
    }
    return this.http.post<StoredReagent>(
      `${this.baseURL}/api/stored_reagent/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  createStoredReagentAction(stored_reagent_id: number, action_type: string, quantity: number, notes: string = "", step_reagent: number|null = null) {
    const payload: any = {action_type: action_type, quantity: quantity, reagent: stored_reagent_id, notes: notes}
    if (step_reagent) {
      payload['step_reagent'] = step_reagent
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

  getStepAssociatedReagentActions(step_id: number) {
    return this.http.get<ReagentAction[]>(
      `${this.baseURL}/api/step/${step_id}/get_associated_reagent_actions/`,
      {responseType: 'json', observe: 'body'}
    )
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

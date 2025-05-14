import { Component, OnInit } from '@angular/core';
import {MessagePriority, MessageThread, MessageThreadDetail, MessageType, UserBasic} from '../message';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MessageService} from "../message.service";
import {DatePipe, NgClass} from "@angular/common";
import {QuillEditorComponent, QuillViewComponent} from "ngx-quill";
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbPagination,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {User} from "../user";
import {WebService} from "../web.service";
import {AccountsService} from "../accounts/accounts.service";

@Component({
  selector: 'app-messaging',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    QuillEditorComponent,
    NgClass,
    NgbTooltip,
    FormsModule,
    QuillViewComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbPagination
  ],
  templateUrl: './messaging.component.html',
  styleUrl: './messaging.component.scss'
})
export class MessagingComponent implements OnInit {
  maxFileSizeMB:number = 5;
  fileSizeErrorMessage = '';
  selectedMessageTypeFilter: MessageType | 'all' = 'all';
  threads: MessageThread[] = [];
  selectedThread: MessageThreadDetail | null = null;
  messageForm: FormGroup = this.fb.group({
    content: ['', Validators.required],
    messageType: ['user_message', Validators.required],
    priority: ['normal', Validators.required],
    title: ['', Validators.required],
    recipientIds: [[]]
  });
  attachments: File[] = [];
  loading = false;

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  messageTypes: {value: MessageType, label: string}[] = [
    {value: 'user_message', label: 'User Message'},
    {value: 'system_notification', label: 'System Notification'},
    {value: 'alert', label: 'Alert'},
    {value: 'announcement', label: 'Announcement'}
  ];

  priorities: {value: MessagePriority, label: string}[] = [
    {value: 'low', label: 'Low'},
    {value: 'normal', label: 'Normal'},
    {value: 'high', label: 'High'},
    {value: 'urgent', label: 'Urgent'}
  ];

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  userSearchTerm: string = '';
  userResults: User[] = [];
  selectedRecipients: Partial<User>[] = [];

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private webService: WebService,
    public accounts: AccountsService
  ){

  }

  ngOnInit(): void {
    this.loadThreads();
  }


  loadThreads(): void {
    this.loading = true;
    const params: {
      limit?: number,
      offset?: number,
      message_type?: string,
      all?: boolean,
    } = {
      limit: this.pageSize,
      offset: (this.currentPage - 1) * this.pageSize
    }
    if (this.selectedMessageTypeFilter !== 'all') {
      params.message_type = this.selectedMessageTypeFilter;
    }
    this.messageService.getThreads(params).subscribe(
      response => {
        this.threads = response.results;
        this.totalItems = response.count;
        this.loading = false;
      },
      error => {
        console.error('Error loading message threads', error);
        this.loading = false;
      }
    );
  }

  selectThread(thread: MessageThread): void {
    this.loading = true;
    this.messageService.getThread(thread.id).subscribe(
      threadDetail => {
        this.selectedThread = threadDetail;
        this.messageForm.controls['title'].setValue(this.selectedThread.title);
        this.loading = false;
        if (this.selectedThread) {
          this.messageService.markAllThreadMessagesAsRead(thread.id).subscribe();
        }
      },
      error => {
        console.error('Error loading thread details', error);
        this.loading = false;
      }
    );
  }

  sendMessage(): void {
    if (this.messageForm.invalid) return;

    const formValue = this.messageForm.value;

    // Create a new thread if needed
    if (!this.selectedThread) {
      this.messageService.createThread({
        title: formValue.title,
        participant_ids: formValue.recipientIds,
        is_system_thread: formValue.messageType !== 'user_message'
      }).subscribe(thread => {
        // Send the message in the new thread
        const messageData = {
          thread: thread.id,
          content: formValue.content,
          message_type: formValue.messageType,
          priority: formValue.priority
        };

        this.messageService.sendMessage(messageData, this.attachments).subscribe(
          () => {
            this.resetForm();
            this.loadThreads();
          },
          error => console.error('Error sending message', error)
        );
      });
    } else {
      // Send a reply to existing thread
      const messageData = {
        thread: this.selectedThread.id,
        content: formValue.content,
        message_type: formValue.messageType,
        priority: formValue.priority
      };

      this.messageService.sendMessage(messageData, this.attachments).subscribe(
        () => {
          this.resetForm();
          const thread = this.selectedThread as MessageThread;
          this.selectedRecipients = [];
          this.userResults = [];
          this.selectThread(thread);
        },
        error => console.error('Error sending message', error)
      );
    }
  }

  handleFileInput(event: any): void {
    const files: FileList = event.target.files;
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];
    Array.from(files).forEach(file => {
      if (file.size <= this.maxFileSizeMB * 1024 * 1024) {
        validFiles.push(file);
      } else {
        oversizedFiles.push(file.name);
      }
    });

    this.attachments = [...this.attachments, ...validFiles];

    if (oversizedFiles.length > 0) {
      this.fileSizeErrorMessage = `${oversizedFiles.length} file(s) exceeded the ${this.maxFileSizeMB}MB limit: ${oversizedFiles.join(', ')}`;
    } else {
      this.fileSizeErrorMessage = '';
    }
    event.target.value = '';
  }

  resetForm(): void {
    this.messageForm.reset({
      messageType: 'user_message',
      priority: 'normal'
    });
    this.attachments = [];
  }

  createNewThread(): void {
    this.selectedThread = null;
    this.resetForm();
  }

  searchUsers(term: any) {
    this.userSearchTerm = term;
    if (term.length >= 2) {
      this.webService.getUsers(undefined, 10, 0, term)
        .subscribe(results => {
          // Filter out already selected users
          this.userResults = results.results.filter(
            (user:User) => !this.selectedRecipients.some(r => r.id === user.id)
          );
        });
    } else {
      this.userResults = [];
    }
  }

  clearUserSearch() {
    this.userSearchTerm = '';
    this.userResults = [];
  }

  removeRecipient(user: Partial<User>) {
    this.selectedRecipients = this.selectedRecipients.filter(r => r.id !== user.id);
    this.userResults.push(user as User);
    this.messageForm.controls['recipientIds'].setValue(this.selectedRecipients.map(r => r.id));
  }

  addRecipient(user: Partial<User>) {
    if (!this.selectedRecipients.some(r => r.id === user.id)) {
      this.selectedRecipients.push(user);
      this.userResults = this.userResults.filter(u => u.id !== user.id);
      this.messageForm.controls['recipientIds'].setValue(
        this.selectedRecipients.map(r => r.id)
      );
    }
  }

  filterByMessageType(type: MessageType | 'all'): void {
    this.selectedMessageTypeFilter = type;
    this.loadThreads();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadThreads();
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }
}

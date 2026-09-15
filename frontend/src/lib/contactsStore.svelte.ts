import type { ContactDetail, ContactSummary } from './contacts'
import { contactToSummary, fetchContact, fetchContacts } from './contacts'
import { EntityStore } from './entityStore.svelte'
import { saveNoteBody } from './notes'

class ContactsStore extends EntityStore<ContactSummary, ContactDetail> {
  constructor() {
    super({
      key: 'careeros.contacts',
      fetchList: fetchContacts,
      fetchDetail: fetchContact,
      save: (id, body) => saveNoteBody<ContactDetail>(`/api/contacts/${encodeURIComponent(id)}`, body),
      toSummary: contactToSummary,
      loadError: 'Could not load contacts',
      notFoundError: 'Contact not found',
      detailError: 'Could not load contact',
    })
  }
}

export const contactsStore = new ContactsStore()

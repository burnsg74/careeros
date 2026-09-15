import { contactsStore } from './contactsStore.svelte'
import { jobBoardsStore } from './jobBoardsStore.svelte'
import { jobsStore } from './jobsStore.svelte'

export function bootStores() {
  void jobsStore.start()
  void contactsStore.start()
  void jobBoardsStore.start()
}

export function resetStores() {
  jobsStore.reset()
  contactsStore.reset()
  jobBoardsStore.reset()
}

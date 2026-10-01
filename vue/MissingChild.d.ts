import type { DefineComponent } from 'vue'

export type MissingChildProps = { endpoint?: string; country?: string; region?: string }
declare const MissingChild: DefineComponent<MissingChildProps>
export default MissingChild

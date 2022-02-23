//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import activity from '@anticrm/activity'
import { Domain, IndexKind, Type } from '@anticrm/core'
import type { Message, SharedMessage, SharedMessages } from '@anticrm/gmail'
import { ArrOf, Builder, Index, Model, Prop, TypeBoolean, TypeString } from '@anticrm/model'
import contact from '@anticrm/model-contact'
import core, { TAttachedDoc } from '@anticrm/model-core'
import setting from '@anticrm/setting'
import gmail from './plugin'

export const DOMAIN_GMAIL = 'gmail' as Domain

function TypeSharedMessage (): Type<SharedMessage> {
  return { _class: gmail.class.SharedMessage, label: gmail.string.SharedMessage }
}

@Model(gmail.class.Message, core.class.AttachedDoc, DOMAIN_GMAIL)
export class TMessage extends TAttachedDoc implements Message {
  @Prop(TypeString(), gmail.string.MessageID)
  messageId!: string

  @Prop(TypeString(), gmail.string.ReplyTo)
  @Index(IndexKind.FullText)
  replyTo?: string

  @Prop(TypeString(), gmail.string.From)
  @Index(IndexKind.FullText)
  from!: string

  @Prop(TypeString(), gmail.string.To)
  @Index(IndexKind.FullText)
  to!: string

  @Prop(TypeString(), contact.string.Contact)
  @Index(IndexKind.FullText)
  contact!: string

  @Prop(TypeString(), gmail.string.Subject)
  @Index(IndexKind.FullText)
  subject!: string

  @Prop(TypeString(), gmail.string.Message)
  @Index(IndexKind.FullText)
  content!: string

  @Prop(TypeString(), gmail.string.Message)
  @Index(IndexKind.FullText)
  textContent!: string

  @Prop(ArrOf(TypeString()), gmail.string.Copy)
  copy?: string[]

  @Prop(TypeBoolean(), gmail.string.Incoming)
  incoming!: boolean
}

@Model(gmail.class.SharedMessages, core.class.AttachedDoc, DOMAIN_GMAIL)
export class TSharedMessages extends TAttachedDoc implements SharedMessages {
  @Prop(ArrOf(TypeSharedMessage()), gmail.string.Messages)
  messages!: SharedMessage[]
}

export function createModel (builder: Builder): void {
  builder.createModel(TMessage, TSharedMessages)

  builder.createDoc(
    contact.class.ChannelProvider,
    core.space.Model,
    {
      label: gmail.string.Email,
      icon: contact.icon.Email,
      placeholder: gmail.string.EmailPlaceholder,
      presenter: gmail.component.Main,
      integrationType: gmail.integrationType.Gmail
    },
    contact.channelProvider.Email
  )

  builder.createDoc(
    setting.class.IntegrationType,
    core.space.Model,
    {
      label: gmail.string.IntegrationLabel,
      description: gmail.string.IntegrationDescription,
      icon: gmail.component.IconGmail,
      createComponent: gmail.component.Connect,
      onDisconnect: gmail.handler.DisconnectHandler
    },
    gmail.integrationType.Gmail
  )

  builder.createDoc(
    core.class.Space,
    core.space.Model,
    {
      name: 'Gmail',
      description: 'Space for all gmail messages',
      private: false,
      archived: false,
      members: []
    },
    gmail.space.Gmail
  )

  builder.createDoc(
    activity.class.TxViewlet,
    core.space.Model,
    {
      objectClass: gmail.class.SharedMessages,
      icon: contact.icon.Telegram,
      txClass: core.class.TxCreateDoc,
      component: gmail.activity.TxSharedCreate,
      label: gmail.string.SharedMessages,
      display: 'content'
    },
    gmail.ids.TxSharedCreate
  )
}

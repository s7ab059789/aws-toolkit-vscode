/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Commands, VsCodeCommandArg, placeholder } from '../../shared/vscode/commands2'
import { ChatControllerMessagePublishers } from '../controllers/chat/controller'
import vscode from 'vscode'

/**
 * Opens the Amazon Q chat window.
 */
export const focusAmazonQPanel = Commands.declare(
    { id: `aws.amazonq.focusChat`, compositeKey: { 1: 'source' } },
    () => async (_: VsCodeCommandArg, source: string) => {
        await vscode.commands.executeCommand('aws.AmazonQChatView.focus')
    }
)

/**
 * {@link focusAmazonQPanel} but only used for the keybinding since we cannot
 * explicitly set the `source` in the package.json definition
 */
export const focusAmazonQPanelKeybinding = Commands.declare('_aws.amazonq.focusChat.keybinding', () => async () => {
    await focusAmazonQPanel.execute(placeholder, 'keybinding')
})

const getCommandTriggerType = (data: any): EditorContextCommandTriggerType => {
    // data is undefined when commands triggered from keybinding or command palette. Currently no
    // way to differentiate keybinding and command palette, so both interactions are recorded as keybinding
    return data === undefined ? 'keybinding' : 'contextMenu'
}

export function registerCommands(controllerPublishers: ChatControllerMessagePublishers) {
    Commands.register('aws.amazonq.explainCode', async data => {
        return focusAmazonQPanel.execute(placeholder, 'amazonq.explainCode').then(() => {
            controllerPublishers.processContextMenuCommand.publish({
                type: 'aws.amazonq.explainCode',
                triggerType: getCommandTriggerType(data),
            })
        })
    })
    Commands.register('aws.amazonq.refactorCode', async data => {
        return focusAmazonQPanel.execute(placeholder, 'amazonq.refactorCode').then(() => {
            controllerPublishers.processContextMenuCommand.publish({
                type: 'aws.amazonq.refactorCode',
                triggerType: getCommandTriggerType(data),
            })
        })
    })
    Commands.register('aws.amazonq.fixCode', async data => {
        return focusAmazonQPanel.execute(placeholder, 'amazonq.fixCode').then(() => {
            controllerPublishers.processContextMenuCommand.publish({
                type: 'aws.amazonq.fixCode',
                triggerType: getCommandTriggerType(data),
            })
        })
    })
    Commands.register('aws.amazonq.optimizeCode', async data => {
        return focusAmazonQPanel.execute(placeholder, 'amazonq.optimizeCode').then(() => {
            controllerPublishers.processContextMenuCommand.publish({
                type: 'aws.amazonq.optimizeCode',
                triggerType: getCommandTriggerType(data),
            })
        })
    })
    Commands.register('aws.amazonq.sendToPrompt', async data => {
        return focusAmazonQPanel.execute(placeholder, 'amazonq.sendToPrompt').then(() => {
            controllerPublishers.processContextMenuCommand.publish({
                type: 'aws.amazonq.sendToPrompt',
                triggerType: getCommandTriggerType(data),
            })
        })
    })
}

export type EditorContextCommandType =
    | 'aws.amazonq.explainCode'
    | 'aws.amazonq.refactorCode'
    | 'aws.amazonq.fixCode'
    | 'aws.amazonq.optimizeCode'
    | 'aws.amazonq.sendToPrompt'

export type EditorContextCommandTriggerType = 'contextMenu' | 'keybinding' | 'commandPalette' | 'click'

export interface EditorContextCommand {
    type: EditorContextCommandType
    triggerType: EditorContextCommandTriggerType
}

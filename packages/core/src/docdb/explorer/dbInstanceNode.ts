/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { inspect } from 'util'
import { DBInstance } from '../../shared/clients/docdbClient'
import { DocDBContext, DocDBNodeContext } from './docdbContext'
import { DBResourceNode } from './dbResourceNode'
import { DBClusterNode } from './dbClusterNode'
import { ModifyDBInstanceMessage } from '@aws-sdk/client-docdb'
import { copyToClipboard } from '../../shared/utilities/messages'
import { toTitleCase } from '../../shared'

/**
 * An AWS Explorer node representing a DocumentDB instance.
 */
export class DBInstanceNode extends DBResourceNode {
    override name = this.instance.DBInstanceIdentifier!
    override arn = this.instance.DBInstanceArn!

    constructor(
        public readonly parent: DBClusterNode,
        readonly instance: DBInstance
    ) {
        super(parent.client, instance.DBInstanceIdentifier ?? '[Instance]', vscode.TreeItemCollapsibleState.None)
        this.description = this.makeDescription()
        this.contextValue = this.getContext()
        this.iconPath = this.isAvailable || this.isStopped ? undefined : new vscode.ThemeIcon('loading~spin')
        this.tooltip = `${this.name}\nClass: ${this.instance.DBInstanceClass}\nStatus: ${this.status}`
    }

    private makeDescription(): string {
        const type = this.instance.IsClusterWriter ? 'Primary' : 'Replica'
        if (this.getContext() !== DocDBContext.InstanceAvailable) {
            return `${toTitleCase(this.status ?? ' ')} ${type} instance`
        }
        return `${type} instance • ${this.instance.DBInstanceClass}`
    }

    private getContext(): DocDBNodeContext {
        if (this.isAvailable) {
            return DocDBContext.InstanceAvailable
        }
        return DocDBContext.Instance
    }

    public async rebootInstance(): Promise<boolean> {
        const client = this.parent.client
        return await client.rebootInstance(this.instance.DBInstanceIdentifier!)
    }

    public async renameInstance(instanceName: string): Promise<DBInstance | undefined> {
        const request: ModifyDBInstanceMessage = {
            DBInstanceIdentifier: this.instance.DBInstanceIdentifier,
            NewDBInstanceIdentifier: instanceName,
            ApplyImmediately: true,
        }
        return await this.parent.client.modifyInstance(request)
    }

    override get status() {
        return this.instance.DBInstanceStatus
    }

    override async getStatus() {
        const instance = await this.parent.client.getInstance(this.instance.DBInstanceIdentifier!)
        return instance?.DBInstanceStatus
    }

    override getConsoleUrl() {
        const region = this.regionCode
        return vscode.Uri.parse(
            `https://${region}.console.aws.amazon.com/docdb/home?region=${region}#instance-details/${this.name}`
        )
    }

    override copyEndpoint() {
        return copyToClipboard(this.instance.Endpoint?.Address ?? '', this.name)
    }

    public [inspect.custom](): string {
        return 'DBInstanceNode'
    }
}

// ETL Agent Inner Message
export interface ETLInnerChatMessage {
  sender: string;
  receiver: string;
  message : string | Record<string, any>;
  type: string;
  done: boolean;
}

// ETL Agent Message
export interface ETLInnerChat {
  startLineNo: number;
  endLineNo: number;
  lineCount: number;
  messages: ETLInnerChatMessage[];
}

export enum ChatRoleType {
  USER = "user",
  ASSISTANT = "assistant",
  ETL_AGENT = "etl-agent",
}

// Chat Message
export interface ChatMessage {
  role: ChatRoleType;
  content: string | EtlResponseObject;
  collapsed: Boolean;
}

// ETL Agent Response
export class EtlResponseObject {
  private innerChatSets: ETLInnerChat[] = [];
  private resultMessage: ETLInnerChatMessage | undefined = undefined;
  
  constructor(private lastResponse: ETLInnerChatMessage = {
    sender: '-',
    receiver: '-',
    message: '',
    type: 'string',
    done: true,
  }) {
  }

  public getResultMessage(): ETLInnerChatMessage | undefined {
    return this.resultMessage;
  }

  public getInnerChatSets(): ETLInnerChat[] {
    return this.innerChatSets;
  }

  public addResponse(sseData: string): string | undefined {
    try {
      const ro: ETLInnerChatMessage = JSON.parse(sseData);
      if (ro.sender == 'error') {
        return ro.message as string;
      }

      // not same (sender and receiver)
      if ((this.lastResponse.sender != ro.sender) || (this.lastResponse.receiver != ro.receiver)){
        // loop a ChatMessageSet
        if (ro.sender == 'loop') {
          const message: Record<string, any> = ro.message as Record<string, any>;
          this.innerChatSets.push({
            startLineNo: message.startLineNo,
            endLineNo: message.endLineNo,
            lineCount: message.lineCount,
            messages: [],
          });
        }
        // end all
        else if (ro.sender == 'end') {
          this.resultMessage = ro;
        }
        else {
          this.innerChatSets.at(-1)?.messages.push(ro);
        }
      }
      else {
        if (ro.done) {
          if (this.lastResponse.done == false){
            const lastChatSet = this.innerChatSets.at(-1);
            if (lastChatSet) {
              const lastMessage = lastChatSet.messages.at(-1);
              if (lastMessage) {
                lastMessage.message += ro.message as string;
                lastMessage.done = ro.done;
              }
            }
          } else {
            this.innerChatSets.at(-1)?.messages.push(ro);
          }
        } 
        else {
          if (this.lastResponse.done){
            this.innerChatSets.at(-1)?.messages.push(ro);
          } else {
            const lastChatSet = this.innerChatSets.at(-1);
            if (lastChatSet) {
              const lastMessage = lastChatSet.messages.at(-1);
              if (lastMessage) {
                lastMessage.message += ro.message as string;
              }
            }
          }
        }
      }
      this.lastResponse = ro;
    } catch (error) {
      return `"解析 JSON 时出错: "${error}`;
    }
  }
}
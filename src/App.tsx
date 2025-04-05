import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Scale, Globe2, Volume2, VolumeX, Phone, Mail, Link, Mic, MicOff } from 'lucide-react';

interface Message {
  type: 'user' | 'bot';
  content: string;
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#1a365d] flex items-center justify-center z-50 animate-fade-out">
      <div className="text-center text-white">
        <Scale size={80} className="mx-auto mb-6 animate-bounce" />
        <h1 className="text-5xl font-playfair mb-4 animate-fade-in">Dr. Julio Campos Machado</h1>
        <p className="text-xl font-inter animate-fade-in-delay">Advogado Global</p>
      </div>
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{
    type: 'bot',
    content: 'Olá! Sou o Dr. Julio Campos Machado, seu Advogado Global especialista em direito internacional. Como posso ajudar você hoje? Posso auxiliar com Direito Trabalhista Internacional, Direito Criminal em qualquer país, Direito de Família e Parentalidade, Direito Empresarial Global, Imigração e Vistos. Por favor, me conte sobre seu caso.'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = window.speechSynthesis;
  const recognitionRef = useRef<any>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          handleSend(transcript);
          setTranscript('');
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        const newTranscript = lastResult[0].transcript;
        setTranscript(newTranscript);
        setInput(newTranscript);
        
        if (lastResult.isFinal) {
          if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
          }
          
          pauseTimerRef.current = setTimeout(() => {
            recognitionRef.current?.stop();
          }, 1500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const speakMessage = (text: string) => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const formatResponse = (text: string) => {
    return text
      .replace(/[*_~`]/g, '')
      .replace(/\n\s*[-•]\s*/g, '\n')
      .replace(/\(\s*([^)]+)\s*\)/g, '$1')
      .replace(/\[\s*([^\]]+)\s*\]/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSend = async (voiceInput?: string) => {
    const messageText = voiceInput || input;
    if (!messageText.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: messageText }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_GEMINI_API_URL}?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é o Dr. Julio Campos Machado, um renomado advogado global com expertise em todas as áreas do direito e conhecimento profundo das leis de todos os países do mundo. 

Instruções importantes:
Responda de forma natural e conversacional, como um advogado falando diretamente com seu cliente.
Evite usar caracteres especiais, marcadores ou formatação.
Use linguagem clara e direta.
Mantenha um tom profissional mas acessível.
Separe informações diferentes usando pontos finais e vírgulas.
Use parágrafos para organizar o conteúdo.

Ao responder:
Comece com uma saudação amigável.
Explique os pontos principais de forma clara.
Cite as leis relevantes naturalmente na conversa.
Termine com uma conclusão e próximos passos.

Consulta do cliente: ${messageText}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com a API');
      }

      const data = await response.json();
      const botResponse = formatResponse(data.candidates[0].content.parts[0].text);
      
      const newMessage = { type: 'bot' as const, content: botResponse };
      setMessages(prev => [...prev, newMessage]);
      speakMessage(botResponse);
    } catch (error) {
      console.error('Erro:', error);
      const errorMessage = {
        type: 'bot' as const,
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente em alguns momentos.'
      };
      setMessages(prev => [...prev, errorMessage]);
      speakMessage(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#1a365d] text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scale size={40} />
              <h1 className="text-4xl font-playfair">Dr. Julio Campos Machado</h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Globe2 size={24} />
              <p className="text-xl font-inter">Advogado Global - Especialista em Direito Internacional</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Chat Container */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Chat Messages */}
              <div 
                ref={chatBoxRef}
                className="h-[600px] overflow-y-auto p-6 space-y-4"
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <p className="whitespace-pre-wrap flex-grow">{message.content}</p>
                        {message.type === 'bot' && (
                          <button
                            onClick={() => isSpeaking ? stopSpeaking() : speakMessage(message.content)}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <p className="animate-pulse">Analisando sua consulta...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-4 bg-white">
                <div className="flex gap-4">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? "Falando..." : "Digite sua consulta jurídica..."}
                    className="flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading}
                      className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={24} />
                    </button>
                    <button
                      onClick={toggleListening}
                      disabled={isLoading}
                      className={`${
                        isListening ? 'bg-red-600' : 'bg-blue-600'
                      } text-white rounded-lg px-6 py-2 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={isListening ? "Parar de gravar" : "Começar a gravar"}
                    >
                      {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                  </div>
                </div>
                {isListening && (
                  <div className="mt-2 text-sm text-gray-500">
                    {transcript ? transcript : "Aguardando você falar..."}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-playfair text-center mb-6">Informações de Contato</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Phone className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold">WhatsApp</p>
                    <a href="https://wa.me/5511970603441" className="text-blue-600 hover:underline">+55 11 97060-3441</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold">E-mail</p>
                    <a href="mailto:juliocamposmachado@gmail.com" className="text-blue-600 hover:underline">juliocamposmachado@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold">Website</p>
                    <a href="https://likelook.wixsite.com/solutions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Like Look Solutions</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold">E-mail Corporativo</p>
                    <a href="mailto:likelook@live.com" className="text-blue-600 hover:underline">likelook@live.com</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>* Este é um assistente virtual para consultas preliminares. Recomendamos sempre consultar um profissional jurídico credenciado para assuntos legais formais.</p>
              <p className="mt-2">Desenvolvido por Julio Campos Machado - Like Look Solutions</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
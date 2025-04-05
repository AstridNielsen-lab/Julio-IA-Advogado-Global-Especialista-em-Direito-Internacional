import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Scale, Globe2, Volume2, VolumeX, Phone, Mail, Link } from 'lucide-react';

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
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = window.speechSynthesis;

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
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

Consulta do cliente: ${userMessage}`
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
                    placeholder="Digite sua consulta jurídica..."
                    className="flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={24} />
                  </button>
                </div>
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
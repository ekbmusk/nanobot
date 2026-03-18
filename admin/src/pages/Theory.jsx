import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import FormulaPreview from '../components/FormulaPreview'
import { adminAPI } from '../api/admin'

const BLOCK_TYPES = ['text', 'formula', 'example', 'image', 'divider']

const topicKey = (topic, index) => topic?.id ?? topic?.topic_id ?? `topic-${index}`

export default function Theory() {
  const [topics, setTopics] = useState([])
  const [activeTopicId, setActiveTopicId] = useState(null)
  const [blocks, setBlocks] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminAPI.getTheory()
        const items = data.items || data || []
        setTopics(items)
        if (items[0]) {
          setActiveTopicId(topicKey(items[0], 0))
          setBlocks(items[0].content_blocks || items[0].blocks || [])
        }
      } catch (error) {
        toast.error(error.message)
      }
    }
    load()
  }, [])

  const activeTopic = useMemo(
    () => topics.find((topic, index) => topicKey(topic, index) === activeTopicId),
    [topics, activeTopicId]
  )

  const selectTopic = (topic, index) => {
    setActiveTopicId(topicKey(topic, index))
    setBlocks(topic.content_blocks || topic.blocks || [])
  }

  const addBlock = (type) => {
    setBlocks((prev) => [...prev, { id: crypto.randomUUID(), type, content: '' }])
  }

  const updateBlock = (index, content) => {
    setBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, content } : block)))
  }

  const removeBlock = (index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }

  const onDragEnd = (result) => {
    if (!result.destination) return
    const next = [...blocks]
    const [moved] = next.splice(result.source.index, 1)
    next.splice(result.destination.index, 0, moved)
    setBlocks(next)
  }

  const save = async () => {
    if (!activeTopicId) return
    try {
      await adminAPI.updateTheory(activeTopicId, { content_blocks: blocks })
      toast.success('Теория сақталды')
      setTopics((prev) =>
        prev.map((topic, index) =>
          topicKey(topic, index) === activeTopicId ? { ...topic, content_blocks: blocks } : topic
        )
      )
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="card p-3">
        <p className="mb-2 text-sm font-semibold">Тақырыптар</p>
        <div className="space-y-1">
          {topics.map((topic, index) => {
            const key = topicKey(topic, index)
            return (
            <button
              key={key}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                activeTopicId === key ? 'bg-primary/20 text-white' : 'hover:bg-surface-2 text-text-2'
              }`}
              onClick={() => selectTopic(topic, index)}
              type="button"
            >
              {topic.title || topic.name || `Topic #${topic.id}`}
            </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="card flex flex-wrap items-center justify-between gap-2 p-3">
          <p className="text-sm font-semibold">{activeTopic?.title || 'Тақырып таңдаңыз'}</p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((type) => (
              <button key={type} className="btn-secondary !px-3 !py-1.5" onClick={() => addBlock(type)} type="button">
                + {type}
              </button>
            ))}
            <button className="btn-primary !px-3 !py-1.5" onClick={save} type="button">
              Сақтау
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="theory-blocks">
            {(provided) => (
              <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                {blocks.map((block, index) => (
                  <Draggable key={block.id || index} draggableId={String(block.id || index)} index={index}>
                    {(draggableProvided) => (
                      <div
                        className="card p-3"
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs uppercase text-text-2">{block.type}</span>
                          <button className="text-xs text-danger" onClick={() => removeBlock(index)} type="button">
                            Жою
                          </button>
                        </div>

                        {block.type === 'divider' ? (
                          <div className="my-3 h-px bg-border" />
                        ) : (
                          <textarea
                            className="input min-h-20"
                            value={block.content || ''}
                            onChange={(event) => updateBlock(index, event.target.value)}
                            placeholder="Контент..."
                          />
                        )}

                        {block.type === 'formula' && <FormulaPreview value={block.content} />}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
}

import Card from "../models/Card.js";

export const createCard = async (req, res, next) => {
  try {
    const { title, columnId, boardId, order, assignees, labels } = req.body;
    const card = await Card.create({
      title,
      column: columnId,
      board: boardId,
      labels,
      order,
    });
    res.status(201).json({ status: "success", data: { card } });
  } catch (error) {
    next(error);
  }
};

export const getCards = async (req, res, next) => {
  try {
    const { columnId } = req.params;
    const cards = await Card.find({ column: columnId }).sort("order");
    res.status(200).json({ status: "success", data: { cards } });
  } catch (error) {
    next(error);
  }
};

export const updateCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const card = await Card.findByIdAndUpdate(cardId, req.body, { new: true });
    res.status(200).json({ status: "success", data: { card } });
  } catch (error) {
    next(error);
  }
};

export const getSingleCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const card = await Card.findById(cardId);
    if (!card) {
      return res
        .status(404)
        .json({ status: "fail", message: "Card not found" });
    }
    res.status(200).json({ status: "success", data: { card } });
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const card = await Card.findByIdAndDelete(cardId);
    if (!card) {
      return res
        .status(404)
        .json({ status: "fail", message: "Card not found" });
    }
    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};

export const moveCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { targetColumnId, targetOrder } = req.body;

    const card = await Card.findById(cardId);
    if (!card) {
      return res
        .status(404)
        .json({ status: "fail", message: "Card not found" });
    }

    card.column = targetColumnId;
    card.order = targetOrder;
    await card.save();

    res.status(200).json({ status: "success", data: { card } });
  } catch (error) {
    next(error);
  }
};
